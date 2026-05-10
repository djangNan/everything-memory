# modn-profile

Sites embed a `<script>` tag, our backend collects user behaviour, AI synthesizes a cross-site memory.

Built for the **Nozomio Hackathon — Ship It / Full-Stack Agents** track (Nia + InsForge).

## Live demo URLs

| Surface | URL |
|---|---|
| MockPle storefront | https://em-mockple.vercel.app |
| MockZon storefront | https://em-mockzon.vercel.app |
| Admin dashboard    | https://em-admin-six.vercel.app |

Backend (InsForge edge functions): `https://p83mrur5.us-east.insforge.app/functions/{events,profile-query}`

## How the demo runs (3 minutes)

1. Open MockPle, log in as `demo@user.com`, view iPhone + MacBook.
2. Open MockZon in the same browser, log in with the same email — a **"Recommended for Apple fans"** banner appears (cross-site personalization via SHA-256 email hash matching).
3. Open Admin → MockZon site → that user → ask *"What is this user interested in?"*. The InsForge AI gateway (`openai/gpt-4o-mini`) synthesizes an answer with cited event sources.

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Backend (auth/DB/edge fns) | **InsForge** | Sponsor; Postgres + Subhosting Deno functions |
| Semantic indexing | **Nia** | Sponsor; opt-in (fallback path is the InsForge AI gateway) |
| Frontend × 3 | **Next.js 16 + Tailwind v4** on Vercel | mockple, mockzon, admin |
| Embeddable script | Hand-bundled vanilla TS IIFE | Web Crypto SHA-256, zero deps |
| LLM | InsForge AI Gateway → `openai/gpt-4o-mini` | One key, billed via InsForge AI credits |
| Monorepo | pnpm workspace | `apps/*`, `packages/*`, `services/*` |

## Repo layout

```
apps/mockple/         demo storefront 1 (Apple-ish)
apps/mockzon/         demo storefront 2 (Amazon-ish) + PersonalBanner
apps/admin/           NL question UI for site owners
packages/em-script/   embeddable em.js source (copied into each app's /public)
services/api/         Deno edge function source (events.ts, profile-query.ts, nia-sync.ts)
db/migrations/        SQL schema applied to InsForge
```

Specs: `CONTEXT.md` (shared contract) · `SPEC.md` (system design) · `d-spec.md` / `j-spec.md` (per-role build plans).

## Run locally

```sh
pnpm install
pnpm dev:mockple   # :3001
pnpm dev:mockzon   # :3002
pnpm dev:admin     # :3003
```

`.env.example` lists required keys. Real values live in `.env` (gitignored).

## Sponsors

Nia · InsForge · Vercel · Reacher · Hyperspell · Tensorlake · Convex · Aside · Devin · OpenAI Codex · Entrepreneurs First.
