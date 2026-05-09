# ORDER.md — Build Execution Plan (3-hour budget)

이 문서는 SPEC.md 구현을 위한 **순차 종속성**과 **병렬 실행 가능 작업**을 명시합니다.

## Time Budget
| Phase | Budget | Cumulative |
|---|---|---|
| Phase 0: Bootstrap | 15 min | 0:15 |
| Phase 1: Backend foundation | 45 min | 1:00 |
| Phase 2: Frontend (parallel) | 60 min | 2:00 |
| Phase 3: Integration + Deploy | 45 min | 2:45 |
| Buffer / fixes | 15 min | 3:00 |

---

## Dependency Graph (high level)

```
                         ┌─ T2.1 script lib ──────┐
T0 bootstrap ─► T1 schema ─┤                       ├─► T3.1 mockple ─┐
                           ├─ T1.2 collect API ────┤                  │
                           └─ T1.3 query API ──────┼─► T3.2 mockzon ─┼─► T4 deploy
                                                   │                  │
                                                   └─► T3.3 admin ───┘
                           T1.4 Nia indexing ─────────────────────────┤
                                                                       │
                                                              T5 demo data seed
```

`├` = parallel-eligible siblings  
`─►` = strict prerequisite

---

## Phase 0 — Bootstrap (sequential, 15 min)

These MUST complete first. Single-threaded.

### T0.1 — Repo + tooling [SEQUENTIAL, blocker]
- `pnpm init`, set up monorepo: `apps/mockple`, `apps/mockzon`, `apps/admin`, `packages/em-script`, `services/api`.
- Add `tsup`, `typescript`, `next` skeleton.
- Single `pnpm-workspace.yaml`.

### T0.2 — InsForge project [SEQUENTIAL, blocker]
- Create InsForge project via promo: https://insforge.dev/promo/NIA
- Capture project URL + service key into `.env.example`.
- Verify auth + DB ready.

### T0.3 — Nia account [SEQUENTIAL, blocker]
- Sign up at app.trynia.ai, redeem `NIAHACK` promo.
- Capture API key into `.env.example`.
- Identify the index/upload endpoint we will use (Nia Sync daemon vs direct upload). **Decision recorded in commit message.**

### T0.4 — Vercel project link [SEQUENTIAL, blocker]
- `vercel link` for the three Next.js apps (or one project with three routes — decide on T0.4).
- Confirm deploys reach production URL.

> ✋ **Gate:** Phase 0 complete only when `.env.example` has 3 secrets and a "hello world" Vercel deploy is live.

---

## Phase 1 — Backend foundation (45 min, partial parallel)

### T1.1 — DB schema migration [SEQUENTIAL, blocker for everything DB-touching]
- Create `users`, `events`, `sites` tables in InsForge.
- Seed one row in `sites`: `mockple` + `mockzon` with hardcoded API keys for demo.
- **Owner:** Backend dev / executor agent.

### Parallel batch P1 — runs after T1.1
Once T1.1 lands, the following 3 tasks run **in parallel** (different files, no shared mutation):

#### T1.2 — POST /events edge function [PARALLEL with T1.3, T1.4]
- File: `services/api/events.ts`
- Validate `apiKey` against `sites`.
- Insert row into `events`.
- Upsert `users` if new `user_hash`.
- CORS: `Access-Control-Allow-Origin: *`.

#### T1.3 — POST /profile/query edge function [PARALLEL with T1.2, T1.4]
- File: `services/api/profile-query.ts`
- Pulls all events for `user_hash`.
- Calls Nia search OR fallback inline LLM (decided in T0.3).
- Returns `{ answer, sources[] }`.

#### T1.4 — Nia indexing pipeline [PARALLEL with T1.2, T1.3]
- File: `services/api/nia-sync.ts`
- Function `upsertProfile(userHash)`: fetches events, formats markdown, pushes to Nia.
- Triggered from T1.2 after each event insert (fire-and-forget).
- **Risk gate:** if Nia upload latency >5s, switch T1.3 to inline-LLM fallback. Document in code comment.

> ✋ **Gate:** Phase 1 complete when curl POST /events returns 200, profile-query returns synthesized text.

---

## Phase 2 — Frontend (60 min, heavy parallel)

### T2.1 — Script library `em.js` [SEQUENTIAL, blocks T3.x]
- Package: `packages/em-script`
- Exports `window.EM = { init, identify, track, setDemographics }`.
- SHA-256 via Web Crypto API.
- POSTs to `/events` endpoint.
- Bundled with `tsup --format iife --minify` to `dist/em.js`.
- Hosted from `apps/admin/public/em.js` for simple CDN (or Vercel static).

### Parallel batch P2 — runs after T2.1 + T1.x
The following **3 tasks run fully in parallel** (different apps, no shared files):

#### T3.1 — `mockple` storefront [PARALLEL with T3.2, T3.3]
- App: `apps/mockple`
- Pages: `/` (home, list 6 products), `/p/[id]` (product page), `/login` (email-only mock login).
- Embed `<script src="/em.js">` in `_app.tsx`; call `EM.init` + `EM.identify` after login.
- Track: `page_view`, `product_view` on product pages.
- Style: minimal Apple-ish (white, large product images).

#### T3.2 — `mockzon` storefront [PARALLEL with T3.1, T3.3]
- App: `apps/mockzon`
- Pages: `/` (homepage with personalized banner zone), `/p/[id]`, `/login`.
- After login, calls `/profile/query` with `"Summarize this user's interests in one sentence"` and renders the answer in the banner.
- Tracks: `page_view`, `product_view`.
- Style: orange/yellow Amazon-ish.

#### T3.3 — Admin dashboard [PARALLEL with T3.1, T3.2]
- App: `apps/admin`
- Page: `/` — login as a "site owner" (mockple/mockzon).
- Page: `/users/[hash]` — input box: "Ask a question about this user". POST to `/profile/query`. Render answer + sources.
- Page: `/users` — list recent user_hashes.
- Style: clean dashboard (Tailwind defaults).

> ✋ **Gate:** Phase 2 complete when each app builds locally and renders a homepage.

---

## Phase 3 — Integration + Deploy (45 min)

### T4.1 — End-to-end smoke test [SEQUENTIAL, blocks T4.2]
- Local run: log into mockple, browse 2 products, log into mockzon with same email, see banner, run admin query.
- Fix any issue surfaced.

### T4.2 — Vercel deploy x3 [PARALLEL]
- `vercel deploy --prod` for each of mockple / mockzon / admin.
- Capture URLs.

### T4.3 — InsForge edge fn deploy [PARALLEL with T4.2]
- Deploy edge functions to InsForge production.
- Update Vercel `NEXT_PUBLIC_API_BASE` env var to production URL.

### T4.4 — Production smoke test [SEQUENTIAL, blocks T5]
- Repeat the manual demo flow on production URLs from a fresh browser.
- Must pass before T5 begins.

---

## Phase 5 — Demo prep & submission (15 min, sequential)

### T5.1 — Seed demo data
- Pre-create `demo@user.com` profile by visiting mockple as that user before judging — this de-risks cold-start lag and Nia indexing latency.

### T5.2 — README
- Add: demo URLs, GitHub link, sponsor mentions (Nia + InsForge + Vercel), 1-paragraph elevator pitch, 60-sec quickstart.

### T5.3 — Submission form
- https://forms.gle/fkoFXRo3L2MVkkz87
- Fields: deployed demo links, GitHub URL, team members.

### T5.4 — Live demo dry run
- Run the 3-minute demo on a clean browser window once before judging.

---

## Parallel Execution Map (for delegation / agent dispatch)

| Wave | Parallel tasks | Required tools/agents |
|---|---|---|
| Wave 1 | T0.1 → T0.2 → T0.3 → T0.4 | Single thread (interactive setup) |
| Wave 2 | T1.1 | executor (backend) |
| Wave 3 | T1.2 ‖ T1.3 ‖ T1.4 | 3× executor agents in parallel |
| Wave 4 | T2.1 | executor (script lib) |
| Wave 5 | T3.1 ‖ T3.2 ‖ T3.3 | 3× designer/executor agents in parallel |
| Wave 6 | T4.1 | qa-tester |
| Wave 7 | T4.2 ‖ T4.3 | 2 deploy threads |
| Wave 8 | T4.4 → T5.1 → T5.2 → T5.3 → T5.4 | Sequential, single thread |

## Hard Stop Rules
- **At T+2:00** (2 hours in): if Phase 2 not done, **drop T3.3 admin dashboard**. Use the `mockzon` banner as the only NL-query proof point.
- **At T+2:30**: if not deployed, **drop one of mockple/mockzon**, run demo with one site only.
- **At T+2:45**: deploy whatever exists. No more new features.
- **Never push localhost-only.** Submission form rejects localhost.

## Decision Log (filled during build)
- [ ] Nia upload mode: Sync daemon ☐ / direct upload ☐ / inline LLM fallback ☐
- [ ] Apps: monorepo Vercel projects ☐ or single project subroutes ☐
- [ ] Auth: InsForge built-in ☐ or simple email-only mock ☐
