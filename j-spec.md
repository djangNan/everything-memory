# j-spec — Frontend + Deploy

> ⚠ **시작 전 필수:** `CONTEXT.md`를 먼저 읽으세요. 데모 스토리, API 계약, 환경변수, 동기화 포인트, 하드 스톱 룰이 모두 거기에 있습니다.
> 의존 그래프는 `ORDER.md`. 이 문서는 j 담당 작업만 다룹니다.

---

## 진척 현황 (live)

상태 표기: ✅ 완료 · 🟡 부분 완료 · ⏸ 게이트 대기 · ❌ 미착수

| Phase | 항목 | 상태 | 비고 / 차단 사유 |
|---|---|:---:|---|
| 0 | **J0.1** Monorepo 셋업 + 3 앱 스캐폴드 + 포트 분리 | ✅ | `7e33988` — pnpm workspace, mockple/mockzon/admin 빌드 그린 |
| 0 | **J0.2** Vercel link x3 | ❌ | `vercel login` 필요 (사용자만) |
| 0 | **J0.3** d 로부터 env 받기 | 🟡 | site key 들 코드에 박힘. `NEXT_PUBLIC_API_BASE` 는 T+2:15 |
| 2 | **J3.1** mockple 페이지 골격 | ✅ | `/`, `/p/[id]` (6 SSG), `/login`, not-found, loading, metadata |
| 2 | **J3.1** mockple **em.js 와이어링** | ⏸ | d 의 phase-1 main 머지 후 즉시 |
| 2 | **J3.2** mockzon 페이지 골격 + PersonalBanner | ✅ | 8 상품, banner client component (env 미설정 시 조용히 skip) |
| 2 | **J3.2** mockzon em.js 와이어링 + 배너 라이브 | ⏸ | em.js + API_BASE |
| 2 | **J3.3** admin 페이지 골격 + 질의 UI + JumpToUser | ✅ | `a90b631` — site selector, NL 질의 폼, 이메일→hash 점프 |
| 2 | **J3.3** admin 라이브 질의 | ⏸ | API_BASE |
| — | **추가** 404 status fix (`dynamicParams=false`) | ✅ | `a90b631` — 미존재 상품 id 가 200→404 정상 반환 |
| — | **추가** 동시 dev 서버 (`pnpm dev` from root) | ✅ | `pnpm -r --parallel dev` 3001/3002/3003 |
| 3 | **J4.1** API_BASE Vercel env 추가 | ❌ | T+2:15 |
| 3 | **J4.2** 3개 앱 프로덕션 배포 | ❌ | J0.2 후 |
| 3 | **J4.3** E2E 스모크 (d 와 함께) | ❌ | 배포 후 |
| 3 | **J4.4** em.js 프로덕션 반영 확인 | ❌ | 배포 후 |
| 5 | **J5.1** README.md 본문 | ❌ | URL 확정 후 |
| 5 | **J5.2** 제출 폼 | ❌ | 5:55 PM 까지 |
| 5 | **J5.3** 데모 드라이런 | ❌ | 마무리 |

**다음 트리거**:
- d 의 `feat/d-phase1-db` (em.js stub + edge fns) main 머지 → J3.x em.js 와이어링 즉시
- 사용자 `vercel login` → J0.2 / J4.2 진행

---

## 소유 디렉토리 (이것만 수정)
```
apps/mockple/      # 가전 쇼핑몰 데모 사이트
apps/mockzon/      # 범용 쇼핑몰 데모 사이트
apps/admin/        # NL 질의 대시보드
README.md          # 제출용 문서
pnpm-workspace.yaml, package.json (루트)  # T0.1에서만 수정, 이후 동결
```

## 절대 손대지 말 것
- `services/api/**`, `packages/em-script/**`, `db/migrations/**` — d 영역
- `apps/admin/public/em.js` — **d가 직접 push.** 절대 수정/삭제 금지.
- `.env.example` — d가 관리. 키는 받기만.

---

## Phase 0 — 모노레포 + Vercel (15분, T+0:00 ~ T+0:15)

### J0.1 — Monorepo 셋업 [블로커, d도 기다림]
```bash
pnpm init
# pnpm-workspace.yaml
echo 'packages:
  - "apps/*"
  - "packages/*"
  - "services/*"' > pnpm-workspace.yaml

mkdir -p apps/{mockple,mockzon,admin}
mkdir -p packages/em-script
mkdir -p services/api
mkdir -p db/migrations

# .gitignore 첫 줄에 .env*
echo '.env*
!.env.example
node_modules
.next
dist' > .gitignore
```

3개 Next.js 앱 스캐폴드 (병렬):
```bash
cd apps/mockple && pnpm create next-app . --ts --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-pnpm
cd ../mockzon && pnpm create next-app . --ts --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-pnpm
cd ../admin && pnpm create next-app . --ts --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-pnpm
```

각 앱의 `package.json`에 포트 분리:
- mockple: `next dev -p 3001`
- mockzon: `next dev -p 3002`
- admin: `next dev -p 3003`

> ✋ **게이트:** 3개 앱이 각각 로컬에서 `pnpm dev` 시 자기 포트로 떴음. main에 push.

### J0.2 — Vercel 링크
```bash
vercel link  # apps/mockple
vercel link  # apps/mockzon
vercel link  # apps/admin
```

각 앱마다 별도 Vercel 프로젝트. 프로덕션 URL 3개 캡처:
- `mockple-em.vercel.app`
- `mockzon-em.vercel.app`
- `admin-em.vercel.app`

빈 hello-world 상태로 한 번 `vercel deploy --prod` 해서 URL 살아있는지 확인. (시간 5분)

> ✋ **게이트:** 3개 URL 모두 200. d에게 URL 공유.

### J0.3 — d로부터 환경변수 받기
T+0:15에 d가 DM으로 보내는 키 4개를 `.env.example`에서 보고 각 앱 `.env.local`에 복사:
```
NEXT_PUBLIC_API_BASE=          # T+2:15 까지는 비워두기 OK
NEXT_PUBLIC_MOCKPLE_KEY=mockple_key_demo_2026
NEXT_PUBLIC_MOCKZON_KEY=mockzon_key_demo_2026
```

---

## Phase 2 — 3개 앱 동시 개발 (60분, T+1:00 ~ T+2:00)

> em.js stub은 T+1:00에 d가 `apps/admin/public/em.js`에 push합니다. 그 전까지는 페이지/UI 골격만 작업 가능. T+0:15 ~ T+1:00 사이에 골격 작업을 미리 시작하면 시간 절약.

### J3.1 — `apps/mockple` (가전 쇼핑몰)

#### 페이지
| 라우트 | 내용 |
|---|---|
| `/` | 헤더 (로그인 상태) + 6개 상품 카드 (iPhone 15 Pro, MacBook Air, iPad, AirPods, Apple Watch, iMac) |
| `/p/[id]` | 상품 상세 (이미지, 이름, 가격, "Buy" 버튼) |
| `/login` | 이메일 input + 로그인 버튼 (비번 없음, 데모용) |

#### Layout (`app/layout.tsx`)
```tsx
<html>
  <body>
    {children}
    <Script src="https://admin-em.vercel.app/em.js" strategy="afterInteractive" />
    <Script id="em-init" strategy="afterInteractive">{`
      window.addEventListener('load', () => {
        EM.init({ apiKey: '${process.env.NEXT_PUBLIC_MOCKPLE_KEY}' });
        const email = localStorage.getItem('demo_email');
        if (email) EM.identify(email);
      });
    `}</Script>
  </body>
</html>
```

#### 트래킹
- `/`: `EM.track('page_view', { page: 'home' })`
- `/p/[id]`: `EM.track('product_view', { name, category, price })`
- `/login` 성공 시: `localStorage.setItem('demo_email', email); EM.identify(email)`

#### 스타일
- 흰 배경, 큰 상품 이미지, 헤어라인 폰트.
- 이미지는 `https://placehold.co/400x400/png?text=iPhone` 같은 placeholder OK.

### J3.2 — `apps/mockzon` (범용 쇼핑몰)

#### 페이지
| 라우트 | 내용 |
|---|---|
| `/` | 상단 **개인화 배너** (cross-site 데모의 핵심!) + 8개 상품 카드 |
| `/p/[id]` | 상품 상세 |
| `/login` | mockple과 동일 |

#### 개인화 배너 (mockzon의 시그니처 기능)
홈 페이지 컴포넌트:
```tsx
'use client';
import { useEffect, useState } from 'react';

export default function PersonalBanner() {
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('demo_email');
    if (!email) return;

    // userHash는 em.js가 localStorage에 저장한 값을 읽거나 직접 계산
    const userHash = localStorage.getItem('em_user_hash');
    if (!userHash) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/profile-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: process.env.NEXT_PUBLIC_MOCKZON_KEY,
        userHash,
        question: 'Summarize this user\'s shopping interests in one short sentence for a personalized banner.'
      })
    })
      .then(r => r.json())
      .then(d => setBanner(d.answer));
  }, []);

  if (!banner) return null;
  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-6">
      <p className="text-sm text-orange-700">Recommended for you</p>
      <p className="text-lg font-semibold">{banner}</p>
    </div>
  );
}
```

#### 트래킹 (mockple과 동일 패턴)
apiKey만 `NEXT_PUBLIC_MOCKZON_KEY`로 교체.

#### 스타일
- 오렌지/노랑 톤 (Amazon-스러움).
- 배너는 눈에 띄게.

### J3.3 — `apps/admin` (관리자 대시보드)

#### 페이지
| 라우트 | 내용 |
|---|---|
| `/` | "Pick a site" 셀렉터 + 최근 user_hash 리스트 |
| `/users/[hash]` | 그 유저 정보 + NL 질의 입력 + 답변 표시 |

#### 사이트 셀렉터 (간이 인증)
```tsx
const SITES = [
  { id: 'mockple', key: 'mockple_key_demo_2026', name: 'MockPle' },
  { id: 'mockzon', key: 'mockzon_key_demo_2026', name: 'MockZon' },
];
// 셀렉트로 선택, localStorage 저장
```

#### NL 질의 UI
```tsx
async function ask() {
  const r = await fetch(`${API_BASE}/profile-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: selectedSite.key,
      userHash,
      question: input
    })
  });
  const data = await r.json();
  setAnswer(data.answer);
  setSources(data.sources);
}
```

답변 + 출처 (event 리스트) 표시. 출처는 site_id, event_type, occurred_at, properties.

#### `public/em.js` 호스팅
- d가 T+1:00 직후 stub을 `apps/admin/public/em.js`에 push.
- T+2:00 직전에 본 구현으로 교체.
- **이 파일은 절대 수정/삭제하지 말 것.**
- mockple, mockzon이 `<script src="https://admin-em.vercel.app/em.js">`로 임베드.

#### 스타일
- 깔끔한 대시보드 (Tailwind 기본). 어두운 헤더 + 흰 본문.

---

## Phase 3 — 배포 + 통합 (45분, T+2:00 ~ T+2:45)

### J4.1 — `NEXT_PUBLIC_API_BASE` 받기 (T+2:15)
d가 InsForge edge fn 배포 후 base URL 공유. 3개 앱의 Vercel 환경변수에 추가:
```bash
vercel env add NEXT_PUBLIC_API_BASE production  # 각 앱별
```

### J4.2 — 3개 앱 프로덕션 배포 [병렬]
```bash
(cd apps/mockple && vercel deploy --prod) &
(cd apps/mockzon && vercel deploy --prod) &
(cd apps/admin && vercel deploy --prod) &
wait
```

### J4.3 — E2E 스모크 (d와 함께, T+2:30)
1. mockple URL 열기 → 로그인 (`demo@user.com`) → iPhone 클릭 → 상세 페이지
2. mockzon URL 새 탭 → 같은 이메일 로그인 → 홈 새로고침 → 배너 보임
3. admin URL → MockZon 선택 → 그 유저 → "What is this user interested in?" → 답변
4. 깨지면 → console + Network 탭 → d와 함께 디버그

### J4.4 — `apps/admin/public/em.js`가 production에 반영됐는지 확인
- mockple/mockzon에서 DevTools → Network → `em.js` 200 + 진짜 SHA-256 코드 보임 확인
- 안 되면 admin 재배포

---

## Phase 5 — README + 제출 (15분, T+2:45 ~ T+3:00)

### J5.1 — README.md
```markdown
# modn-profile

> Cross-site user memory for the AI agent era.
> 사이트들이 우리 script 한 줄을 임베드하면, AI 에이전트가 자연어로 cross-site 사용자 프로필을 질의할 수 있습니다.

## Live Demo
- 🍎 MockPle Store: https://mockple-em.vercel.app
- 🛒 MockZon Marketplace: https://mockzon-em.vercel.app
- 📊 Admin Dashboard: https://admin-em.vercel.app

## How to try in 30 seconds
1. Visit MockPle, log in with `demo@user.com`, browse a few products.
2. Visit MockZon, log in with the same email — see the personalized banner.
3. Open Admin → MockZon → that user → ask any question.

## Stack
- **InsForge** — auth, Postgres, edge functions
- **Nia** — semantic indexing of cross-site behavior
- **Vercel** — Next.js demo storefronts + admin
- **InsForge AI Gateway** (`openai/gpt-4o-mini`) — natural-language profile synthesis

## Why
Third-party cookies are gone. AI agents need durable, queryable user context. modn-profile gives sites a one-line script to share intent across domains, while keeping email private (SHA-256 only).

## Team
- d — Backend + Script lib
- j — Frontend + Deploy

Built at Nozomio Hackathon, May 9 2026.
```

### J5.2 — 제출 폼
https://forms.gle/fkoFXRo3L2MVkkz87
- 데모 URL 3개
- GitHub URL
- 팀원 정보

**6:00 PM 정각 마감. 5:55 PM에 미리 제출.**

### J5.3 — 데모 드라이런 (T+2:50)
- 깨끗한 시크릿 창에서 3분 시연 한 번.
- 시간 측정. 3분 초과면 멘트 줄임.

---

## J 인수기준
- [ ] mockple, mockzon, admin 3개 라이브 URL
- [ ] 3개 앱 모두 `em.js` 임베드 + Network 탭에 `/events` POST 200 확인
- [ ] mockple 로그인 → 상품 조회 → mockzon 같은 이메일 로그인 → 배너 표시
- [ ] admin에서 NL 질의 → 답변 + 출처 표시
- [ ] README에 3개 데모 링크 + 스폰서 명시
- [ ] 제출 폼 5:55 PM까지 제출

## 하드 스톱 룰 (j 관점)
- **T+2:00** mockzon 배너가 안 되면 → 정적 mock 배너로 일단 띄우고 d와 디버그.
- **T+2:30** admin 미완 → 드롭. 데모는 mockple+mockzon만으로. 단, README 링크에 admin 빼기.
- **T+2:45** 한 사이트라도 미배포 → 드롭. 살아있는 것만 README에 적기.
- **T+2:55** 드라이런 안 됐으면 → 시연 멘트만 외우고 들어가기.

## Vercel 배포 팁
- 각 앱의 `next.config.js`에 `output: 'standalone'` 불필요 (Vercel auto).
- `NEXT_PUBLIC_*` 환경변수는 빌드 타임에 inline → 변경 시 재배포 필요.
- 빌드 실패 시 `pnpm install --frozen-lockfile=false` 시도.
- 캐시 버스팅: `?v=2` 같은 쿼리 추가.
