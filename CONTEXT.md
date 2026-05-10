# CONTEXT.md — 공유 컨텍스트 (d-spec, j-spec 공통)

> **에이전트/사람 모두에게:** 작업 시작 전에 이 문서를 **반드시 먼저 읽어주세요.** d-spec.md, j-spec.md는 이 파일에 정의된 계약·결정·약어를 전제로 작성되었습니다.

---

## 0. 프로젝트 한 줄 요약
**Everything Memory** — 사이트들이 우리 `<script>`를 임베드하면 사용자 행동을 InsForge에 저장 + Nia로 시맨틱 인덱싱하여, 다른 사이트/AI 에이전트가 자연어로 cross-site 사용자 프로필을 질의할 수 있는 서비스.

| 항목 | 값 |
|---|---|
| 트랙 | **Ship It — Full-Stack Agents** (Nia + InsForge 후원) |
| 제출 마감 | 6:00 PM (절대 변경 불가) |
| 심사 | 6:10 PM 인-퍼슨, 3분 발표 |
| 빌드 윈도우 | 3시간 |
| 팀원 | 2명 (d = 백엔드+스크립트, j = 프론트+배포) |
| 필수 | 실배포 URL (localhost는 실격) |

---

## 1. 3분 데모 스토리 (모두가 외워야 함)

| 시간 | 화면 | 멘트 요지 |
|---|---|---|
| 0:00–0:20 | 두 데모 사이트 띄움 (mockple, mockzon) | "둘 다 우리 script 한 줄만 임베드했습니다. 사이트 데이터를 통합해 코호트 인사이트로 환원합니다." |
| 0:20–1:10 | mockple 로그인 → 가전류 조회. 다른 탭 mockzon 로그인 → 패션류 조회. | "이벤트는 InsForge에 적재되고 동시에 Nia 컨텍스트로 색인됩니다." |
| 1:10–2:00 | admin **Dashboard** 열기 — KPI 4개 + 카테고리 분포 막대 + 사이트별 활동 + 최근 추론 카드 | "한 화면으로 모든 사이트가 한 풀로 묶여 있습니다. 각 사이트의 데이터가 통합되어 코호트로 환원돼요." |
| 2:00–2:50 | **Cohort console** → interests=[phones] 필터 + "What does this cohort want most?" → "iPhone 15 Pro 선호…" + via:nia 배지 + sources | "개인 접근은 차단. 코호트 ≥2일 때만 답변. 메타데이터는 LLM이 events 보고 주기적으로 추론한 결과입니다. Nia가 11.3% 환각 감소." |
| 2:50–3:00 | URL 다시 보이기 + 마무리 | "라이브 배포. InsForge AI Gateway · Nia Context Sharing · k-anon 보장." |

---

## 2. 아키텍처

```
┌────────────────┐     ┌────────────────┐
│  mockple.app   │     │  mockzon.app   │   <- Vercel 데모 스토어 (각 사이트 1개 라인 임베드)
│  <script em.js>│     │  <script em.js>│
└──────┬─────────┘     └──────┬─────────┘
       │ POST /events         │ POST /events    ── per-site apiKey
       ▼                      ▼
   ┌────────────────────────────────────────────┐
   │  InsForge Edge Functions (Subhosting Deno) │
   │   POST /events            (write + Nia)    │
   │   POST /cohort-query      (read, cohort)   │
   │   GET  /cohort-stats      (read, dash)     │
   │   POST /infer-demographics (admin batch)   │
   └──────┬───────────────┬─────────────────────┘
          ▼               ▼
   ┌─────────────┐    ┌──────────────────────────┐
   │ InsForge PG │    │   Nia Context Sharing    │
   │  events     │    │  /v2/contexts (write)    │
   │  users      │    │  /v2/contexts/           │
   │   .demogs.. │    │     semantic-search      │
   │  sites      │    │   episodic, 7d TTL       │
   └─────────────┘    └──────────────────────────┘
          │                    │
          │  joined by         │
          │  cohort-query +    │
          │  cohort-stats →    │
          ▼                    ▼
   ┌───────────────────────────────────────────┐
   │  admin (Vercel, single integrated view)   │
   │   /         Dashboard (KPIs + charts)     │
   │   /query    Cohort console (NL Q&A)       │
   │   admin_key_demo_2026 — site-agnostic     │
   └───────────────────────────────────────────┘
                         ▲
                         │ k-anon ≥ 2, never returns user_hash
                         │ /infer-demographics: LLM reads events,
                         │   writes users.demographics_json (region,
                         │   gender, age_band, interests, conf)
```

---

## 3. API 계약 (변경 시 양쪽 합의 필수)

### 3.1 Script API (브라우저)
```js
EM.init({ apiKey: string })                          // sync
EM.identify(email: string): Promise<void>            // SHA-256(email) 자동 해시
EM.track(eventType: string, props?: object): Promise<void>
EM.setDemographics(d: { gender?, ageBand?, ... }): Promise<void>
```

`eventType` 표준값: `"page_view"`, `"product_view"`, `"search"`, `"add_to_cart"`, `"demographics_set"`

### 3.2 REST 엔드포인트

| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/events` | `{ apiKey, userHash, eventType, properties, occurredAt? }` | `{ ok: true, eventId }` | per-site apiKey |
| POST | `/cohort-query` | `{ apiKey, filters: {region?, gender?, age_band?, interests?[]}, question, limit_users? }` | `{ answer, sources: Event[], cohort: {size, filters, k_anonymous, min_size}, via: 'nia'\|'fallback'\|'refused'\|'empty', nia? }` | admin apiKey |
| GET  | `/cohort-stats` | — | `{ totals, interests_top, gender, age_band, region, events_by_site, events_by_type, events_by_day, top_products, recent_inferences }` | open (aggregate, no PII) |
| POST | `/infer-demographics` | `{ adminToken, force?, userHashes? }` | `{ inferred_count, skipped_count, inferred[], skipped[] }` | InsForge service key (server only) |
| GET  | `/recent-users` | — | `{ users: [{user_hash, created_at, event_count}] }` | open (legacy probe; cohort dashboard preferred) |

> ⚠ **개인 접근 (`/profile-query`, `/users/{hash}`) 폐쇄.** 보안상 admin은 코호트 단위로만 질의. k-anonymity ≥ `min_size` (현재 2) 미만 코호트는 자동 거부.

`Event` 형태:
```ts
{ event_type: string, site_id: string, properties: object, occurred_at: string }
// user_hash는 응답에서 절대 노출하지 않음
```

### 3.3 인증
- `/events`: 사이트 자체의 `apiKey`. 사이트 자기 데이터만 푸시.
- `/cohort-query`, `/cohort-stats`: admin은 사이트 비종속 키 `admin_key_demo_2026` 사용. 응답에는 모든 사이트 데이터 통합 반영.
- `/infer-demographics`: InsForge service key 필수. 절대 브라우저 노출 금지.
- 데모 키 (시드):
  - mockple: `mockple_key_demo_2026` (push only)
  - mockzon: `mockzon_key_demo_2026` (push only)
  - admin:   `admin_key_demo_2026`   (read across all sites)
- CORS: `Access-Control-Allow-Origin: *` (해커톤 한정).

---

## 4. 사용자 식별

```js
userHash = sha256_hex(email.trim().toLowerCase())
```

- 호스트 사이트는 자체 로그인 후 이메일을 `EM.identify(email)`에 넘김.
- 스크립트가 클라이언트 사이드에서 SHA-256 → hex.
- 서버는 해시만 저장. 원본 이메일 절대 미저장.
- 같은 이메일로 두 사이트에서 로그인하면 동일 `user_hash` → cross-site 매칭.

---

## 5. 환경변수 (공통)

`.env.example` (루트에 1개, 각 앱에 `.env.local`로 복사):

```bash
# 백엔드 (d 작성)
INSFORGE_URL=                  # ex: https://xxx.insforge.dev
INSFORGE_SERVICE_KEY=
INSFORGE_ANON_KEY=
NIA_API_KEY=
# Fallback LLM = InsForge AI Gateway (uses INSFORGE_SERVICE_KEY above).
# No separate OpenAI/Anthropic key needed.

# 프론트 (j 사용)
NEXT_PUBLIC_API_BASE=          # ex: https://xxx.insforge.dev/functions/v1
NEXT_PUBLIC_MOCKPLE_KEY=mockple_key_demo_2026
NEXT_PUBLIC_MOCKZON_KEY=mockzon_key_demo_2026
```

> 키 공유는 슬랙/디스코드 DM **단방향**. 절대 git 커밋 금지. `.env*` 는 `.gitignore` 첫 줄.

---

## 6. 기술 스택 (확정)

| 레이어 | 선택 | 비고 |
|---|---|---|
| 백엔드 (auth/DB/edge fn) | InsForge | 스폰서, 프로 크레딧 사용 |
| 시맨틱 인덱스 | **Nia Context Sharing API** (primary) | 스폰서, NIAHACK 코드. /events가 컨텍스트 저장, /profile-query가 시맨틱 검색 → 결과를 LLM에 주입 |
| 프론트 3개 앱 | Next.js (App Router) + Tailwind | Vercel 배포 |
| 스크립트 라이브러리 | Vanilla TS, tsup IIFE 빌드 | 의존성 0 |
| LLM (NL 질의) | InsForge AI Gateway (model: `openai/gpt-4o-mini`) | 사용자 지정: OpenAI 계열. InsForge 크레딧 차감, 별도 키 없음 |
| 모노레포 | pnpm workspace | j가 T0.1에서 셋업 |

---

## 7. 동기화 포인트 (타임라인)

| 시각 | 이벤트 | d → j 또는 j → d |
|---|---|---|
| T+0:15 | `.env.example` + 키값 공유 | d → j (DM) |
| T+0:15 | `pnpm-workspace.yaml` 셋업 완료 | j → d (push to main) |
| T+1:00 | `em.js` stub push | d → j (push to admin/public/em.js) |
| T+2:00 | `em.js` 본 구현 push | d → j |
| T+2:15 | `NEXT_PUBLIC_API_BASE` 프로덕션 URL 공유 | d → j |
| T+2:30 | E2E 스모크 함께 | 양방향 |
| T+2:50 | 데모 드라이런 | 양방향 |

---

## 8. 하드 스톱 룰 (시간 게이트)

| 시각 | 조건 | 액션 |
|---|---|---|
| T+1:30 | Nia 통합 미완 | **fallback LLM 모드 확정.** Nia 코드 주석. |
| T+2:00 | Phase 2 미완 | T3.3 admin 드롭. mockzon 배너만으로 NL 질의 시연. |
| T+2:30 | 미배포 | 둘 중 하나 사이트 드롭. 단일 사이트 + admin로 데모. |
| T+2:45 | 어떤 상태든 | **신기능 동결.** 배포만 마무리. |
| 6:00 PM | — | 제출 폼 `https://forms.gle/fkoFXRo3L2MVkkz87` |

---

## 9. Git/브랜치 프로토콜

- `main` 브랜치 보호. 직접 push 금지.
- d 브랜치: `feat/d-*` (예: `feat/d-events-api`)
- j 브랜치: `feat/j-*` (예: `feat/j-mockzon-banner`)
- 30분마다 머지. PR 리뷰 생략 가능 (해커톤 모드).
- 컨플릭트 발생 = 영역 침범. SPEC을 재확인.

---

## 10. 디렉토리 소유권 (절대 룰)

```
services/api/**          → d 전용
packages/em-script/**    → d 전용
db/migrations/**         → d 전용

apps/mockple/**          → j 전용
apps/mockzon/**          → j 전용
apps/admin/**            → j 전용 (단, public/em.js 는 d가 push)

pnpm-workspace.yaml      → j (T0.1 후 동결)
package.json (루트)       → j (T0.1 후 동결)
README.md                → j 전용
.env.example             → d 전용
SPEC.md, ORDER.md, CONTEXT.md, *-spec.md → 양쪽 읽기 전용 (변경 시 양쪽 합의)
```

---

## 11. 용어집

| 용어 | 정의 |
|---|---|
| `em.js` | 임베디드 스크립트 라이브러리. Everything Memory의 클라이언트. |
| `EM` | `window.EM` 글로벌. `init/identify/track/setDemographics` 메서드. |
| `user_hash` | SHA-256(lowercased email) hex. 사용자 식별 유일 키. |
| `site_id` | 사이트 식별자 (`mockple`, `mockzon`). |
| `apiKey` | 사이트별 인증 토큰. `sites` 테이블에 저장. |
| `mockple` | 가전 쇼핑몰 데모 사이트 (Apple-스러움). |
| `mockzon` | 범용 쇼핑몰 데모 사이트 (Amazon-스러움). |
| `admin` | 사이트 소유자가 NL 질의하는 대시보드. |
| `Nia` | 스폰서. Context Sharing API (vector + BM25 hybrid 시맨틱 검색). 모든 이벤트가 episodic 컨텍스트로 저장됨 (TTL 7d). |
| `InsForge` | 스폰서. Auth + Postgres + edge functions + AI 게이트웨이. |
| `fallback` | Nia 호출 실패 시 DB events 100건만으로 LLM 합성. 항상 둘 다 시도. |

---

## 12. 스폰서 크레딧 (사전 클레임 필수)

| 스폰서 | 코드/링크 | 사용 |
|---|---|---|
| Nia | `NIAHACK` @ app.trynia.ai → Billing | 인덱싱 + 시맨틱 검색 |
| InsForge | https://insforge.dev/promo/NIA | 백엔드 풀스택 + AI 게이트웨이 (fallback LLM) |
| Vercel v0 | `NOZOMIO-V0` | (옵션) UI 생성 가속 |
| OpenAI Codex | TatianaSF에게 받기 | (옵션) 코드 생성 |

---

## 13. 인수기준 (전체)

이 중 하나라도 깨지면 데모 실격:

- [ ] 라이브 URL 3개 (mockple, mockzon, admin) — localhost 금지
- [ ] 동일 이메일 로그인 → 동일 `user_hash` 매칭 작동
- [ ] cross-site 개인화 1개 이상 (mockzon 배너)
- [ ] admin에서 NL 질의 → 답변 + 출처
- [ ] 이메일 원본 DB 미저장 (해시만)
- [ ] README에 데모 URL + GitHub + 스폰서 표시
- [ ] 제출 폼 작성 + 6:10 PM 인-퍼슨 출석

---

## 14. 제출 (j 책임, d 검토)

- 폼: https://forms.gle/fkoFXRo3L2MVkkz87
- 필요 정보: 데모 URL 3개, GitHub URL, 팀원 이름/이메일 전원
- **마감: 6:00 PM 정각.** 늦으면 자동 실격.

---

## 15. 와이파이

- SSID: `Entrepreneur Firsts-Guest`
- PW: `501FolsomSF!`

---

## 에이전트/사람 사용 가이드

이 파일을 작업 컨텍스트로 사용하려면:
1. **사람:** 시작 전 5분 정독. 동기화 포인트(7번)와 하드 스톱(8번)은 휴대폰에 메모.
2. **에이전트:** 시스템 프롬프트에 다음을 주입:
   > "작업 시작 전에 `CONTEXT.md`를 읽고, 자신의 역할에 따라 `d-spec.md` 또는 `j-spec.md`를 참조해 실행한다. CONTEXT.md의 결정·계약은 변경 불가, 변경이 필요하면 사람에게 묻는다."
