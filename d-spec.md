# d-spec — Backend + Script Library

> ⚠ **시작 전 필수:** `CONTEXT.md`를 먼저 읽으세요. 데모 스토리, API 계약, 환경변수, 동기화 포인트, 하드 스톱 룰이 모두 거기에 있습니다.
> 의존 그래프는 `ORDER.md`. 이 문서는 d 담당 작업만 다룹니다.
>
> **담당 영역:** API + DB + Nia 연동 + `em.js` 스크립트
> **시간:** 3시간

---

## 소유 디렉토리 (이것만 수정)
```
services/api/          # InsForge edge functions
packages/em-script/    # 임베디드 스크립트 라이브러리
db/migrations/         # SQL schema
```

## 절대 손대지 말 것
- `apps/**` — j-spec 영역
- `pnpm-workspace.yaml`, 루트 `package.json` — j가 T0.1에서 만든 후 동결
- README 본문 — j가 작성

---

## Phase 0 — 외부 계정 (15분, T+0:00 ~ T+0:15)

### D0.1 — InsForge 프로젝트 생성
- https://insforge.dev/promo/NIA 에서 프로 플랜 클레임
- 프로젝트 생성 → URL, service key, anon key 캡처
- **공유:** `INSFORGE_URL`, `INSFORGE_SERVICE_KEY`, `INSFORGE_ANON_KEY` 를 메신저 DM으로 j에게.

### D0.2 — Nia 계정 + 키
- app.trynia.ai 가입 → Billing → 프로모코드 `NIAHACK`
- API key 캡처
- **결정:** Nia 인덱싱 모드 — Sync daemon vs 직접 업로드 API 중 더 빠른 쪽. 5분 안에 결정 못 하면 **inline LLM fallback**으로 즉시 전환 (OpenAI GPT-5.5로 events를 그냥 컨텍스트 주입).
- **공유:** `NIA_API_KEY` + 결정한 모드를 DM.

### D0.3 — OpenAI 키 (fallback용)
- `OPENAI_API_KEY` 준비 (개인 키, 모델 `gpt-5.5`).

> ✋ **게이트:** `.env.example` 파일에 `INSFORGE_URL`, `INSFORGE_SERVICE_KEY`, `NIA_API_KEY`, `OPENAI_API_KEY` 4개 등록 + j에게 값 공유 완료.

---

## Phase 1 — DB + API (45분, T+0:15 ~ T+1:00)

### D1.1 — Schema migration [블로커, 다른 백엔드 작업 모두 차단]
파일: `db/migrations/001_init.sql`

```sql
create table sites (
  site_id text primary key,
  api_key text not null unique,
  display_name text not null,
  created_at timestamptz default now()
);

create table users (
  user_hash text primary key,
  demographics_json jsonb,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_hash text references users(user_hash),
  site_id text references sites(site_id),
  event_type text not null,
  properties jsonb not null default '{}',
  occurred_at timestamptz default now()
);

create index idx_events_user_hash on events(user_hash, occurred_at desc);

-- demo seed
insert into sites (site_id, api_key, display_name) values
  ('mockple', 'mockple_key_demo_2026', 'MockPle Store'),
  ('mockzon', 'mockzon_key_demo_2026', 'MockZon Marketplace');
```

InsForge dashboard SQL editor에서 실행. 또는 InsForge CLI.

> ✋ **게이트:** `select * from sites;` 가 2 rows 반환.

### 병렬 배치 P1 (T+0:30 ~ T+1:00)

다음 3개는 **서로 다른 파일**이므로 본인 안에서 병렬 작성 가능:

#### D1.2 — POST /events
파일: `services/api/events.ts`

요구사항:
- Body: `{ apiKey, userHash, eventType, properties, occurredAt? }`
- `apiKey` → `sites` 조회 → 매칭 안 되면 401
- `users` upsert (user_hash 신규면 insert)
- `events` insert
- Response: `{ ok: true, eventId }`
- CORS: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, OPTIONS`
- OPTIONS preflight 처리
- 끝나기 전에 `niaSync.upsertProfile(userHash)` fire-and-forget 호출 (D1.4와 연결)

#### D1.3 — POST /profile/query
파일: `services/api/profile-query.ts`

요구사항:
- Body: `{ apiKey, userHash, question }`
- `apiKey` 검증
- 최근 100개 이벤트 fetch
- **Primary path (Nia mode):** Nia search API 호출 → answer + sources 반환
- **Fallback path (LLM mode):** events를 마크다운 리스트로 포맷 → OpenAI GPT-5.5 (`gpt-5.5`)에 prompt: "User events:\n{events}\nQuestion: {question}\nAnswer concisely citing event timestamps." → 응답 반환
- 어느 모드든 Response: `{ answer: string, sources: Array<{event_type, site_id, properties, occurred_at}> }`

#### D1.4 — Nia 인덱싱
파일: `services/api/nia-sync.ts`

요구사항:
- `upsertProfile(userHash)`: 그 user의 모든 이벤트 fetch → 마크다운 변환:
  ```
  # User Profile: <hash prefix>...
  
  ## Events
  - [2026-05-09T14:22Z] **mockple**: viewed product "iPhone 15 Pro" (category: phones, price: $1199)
  - [2026-05-09T14:25Z] **mockple**: viewed product "MacBook Air" (category: laptops, price: $999)
  ```
- Nia upload API로 push (document_id = `profile-{userHash}`)
- 실패 시 무시 (fallback 모드에서는 어차피 안 씀)
- 호출자가 `await` 안 함 (비동기 fire-and-forget OK)

> ✋ **게이트:** 다음 3개 curl 명령이 모두 200:
> ```
> curl -XPOST .../events -d '{"apiKey":"mockple_key_demo_2026","userHash":"abc","eventType":"product_view","properties":{"name":"iPhone"}}'
> curl -XPOST .../events -d '{"apiKey":"mockzon_key_demo_2026","userHash":"abc","eventType":"page_view","properties":{}}'
> curl -XPOST .../profile/query -d '{"apiKey":"mockzon_key_demo_2026","userHash":"abc","question":"What is this user interested in?"}'
> ```

---

## Phase 2 — em.js 스크립트 (60분, T+1:00 ~ T+2:00)

### D2.0 — STUB 우선 (5분, T+1:00) [j 차단 해제용 — 최우선]
파일: `apps/admin/public/em.js` (j가 만든 admin app의 public 폴더에 직접 push)

또는 임시로 `services/api/public/em.js`. 위치는 j와 합의.

```js
// stub: signatures only, no real logic yet
window.EM = {
  init: ({ apiKey }) => { window.__EM_KEY = apiKey; console.log('[em] init', apiKey); },
  identify: (email) => { console.log('[em] identify', email); window.__EM_HASH = 'stub_' + email; },
  track: (eventType, props) => { console.log('[em] track', eventType, props); },
  setDemographics: (d) => { console.log('[em] demographics', d); }
};
```

→ DM으로 "stub 올림, 임베드 시작해도 됨" 알림.

### D2.1 — 본 구현
파일: `packages/em-script/src/index.ts`

```ts
type InitOpts = { apiKey: string; apiBase?: string };
type EM = {
  init: (opts: InitOpts) => void;
  identify: (email: string) => Promise<void>;
  track: (eventType: string, properties?: object) => Promise<void>;
  setDemographics: (d: object) => Promise<void>;
};
```

요구사항:
- `init`: state 저장 (apiKey, apiBase, userHash)
- `identify(email)`: Web Crypto API로 SHA-256 → hex string → state.userHash 저장. localStorage에도 캐시.
- `track`: state 검증 후 POST `/events`
- `setDemographics`: track의 특수 케이스로 처리 (`eventType: 'demographics_set'`) — 또는 별도 `/users/demographics` 엔드포인트는 만들지 말고 events에 합침.
- 빌드: `tsup src/index.ts --format iife --global-name=EM --minify --out-dir dist`
- 출력 `dist/em.js` 를 j가 정한 위치로 복사 (e.g. `apps/admin/public/em.js`).
- `apiBase` 기본값: `process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787'` — 실제로는 빌드 시 env 주입.

### D2.2 — em.js 배포 위치 합의
- 옵션 A: `apps/admin/public/em.js` 에 카피 → `https://admin.../em.js`
- 옵션 B: 별도 Vercel 프로젝트로 CDN
- **추천:** 옵션 A. T+1:00에 j와 5초 합의.

> ✋ **게이트:** 두 mock 사이트에서 임베드 후 콘솔에 `[em] init` 로그 + 네트워크 탭에 `/events` POST 200.

---

## Phase 3 — 통합 + 배포 (45분, T+2:00 ~ T+2:45)

### D3.1 — InsForge 프로덕션 배포
- edge functions 3개 (events, profile-query, nia-sync 헬퍼는 import만) 배포
- 배포 후 URL 캡처 → DM으로 j에게: `NEXT_PUBLIC_API_BASE=https://...insforge.dev/functions/v1`

### D3.2 — E2E 스모크 (j와 함께)
- j의 mockple 프로덕션 URL에서 로그인 → 상품 조회
- j의 mockzon 프로덕션 URL에서 같은 이메일 로그인 → 배너 확인
- admin에서 NL 질의 → 답변 확인

### D3.3 — 데모 시드
- 데모 시작 5분 전, `demo@user.com`으로 mockple 방문 → iPhone, MacBook 조회 → Nia 인덱싱 워밍업.
- 또는 직접 SQL로 events 5건 미리 insert.

---

## 인터페이스 계약 (j에게 약속)

```ts
// j는 이 API surface를 신뢰한다.
EM.init({ apiKey: string })
EM.identify(email: string): Promise<void>  // SHA-256 hash 자동
EM.track(eventType: string, properties?: object): Promise<void>
EM.setDemographics({ gender?: string, ageBand?: string, ... }): Promise<void>

POST /events       — script 내부에서만 호출. j는 모름.
POST /profile/query — j의 mockzon 배너 + admin이 호출.
  Body: { apiKey, userHash, question }
  Resp: { answer: string, sources: object[] }
```

⚠ **변경 시:** SPEC.md의 API 섹션을 먼저 수정하고 j에게 알릴 것.

---

## D 인수기준
- [ ] `.env.example` 4개 키 등록
- [ ] DB 3 테이블 + 2 site rows 시드
- [ ] `/events` 200 + DB 행 확인
- [ ] `/profile/query` 자연어 답변 반환 (Nia 또는 fallback 어느 쪽이든)
- [ ] `em.js` stub T+1:00에 j에게 전달
- [ ] `em.js` 본 구현 T+2:00 안에 완료
- [ ] InsForge 프로덕션 배포 + URL j에게 전달

## 하드 스톱 룰
- **T+1:30** Nia 통합 미완 → **fallback 모드 확정**, Nia 코드 주석 처리, LLM 호출로 통일.
- **T+2:00** em.js 본 구현 미완 → stub 그대로 두고 백엔드 우선. 단, hash는 진짜 SHA-256으로 교체할 것 (1분 작업).
