# SPEC: Everything Memory — Cross-Site User Profile Sync

## Metadata
- Hackathon: Nozomio Hackathon (3-hour build window)
- Track: **Ship It — Full-Stack Agents** (Nia + InsForge sponsors)
- Submission deadline: 6:00pm
- Demo time: 3 minutes in-person

## One-Line Pitch
**"AI-native cross-site user memory layer. Sites embed our script; agents query user context across sites in natural language via Nia."**

## Goal
Build a deployed full-stack service where:
1. Multiple websites embed a single `<script>` tag.
2. The script ships authenticated user behavior (page views, product views, demographics) to our backend.
3. Nia indexes each user's behavior as a continuously updated semantic profile.
4. Other websites (or AI agents) query the profile in natural language via our REST API or MCP-style endpoint.

## Demo Story (3 minutes)
1. **Setup (20s)** — Show two demo storefronts: `mockple` (Apple-like gadgets) and `mockzon` (general retail), both embedding `<script src=".../em.js">`.
2. **Data collection (50s)** — Log into mockple as `demo@user.com`, browse iPhone & MacBook. Log into mockzon as the same email; the homepage shows a personalized banner: *"Recommended for Apple fans"*. The recommendation came from cross-site profile lookup.
3. **Natural-language query (60s)** — Open admin dashboard "as if we were mockzon", type *"What is this user interested in?"* → Nia returns a synthesized answer citing the mockple events.
4. **Pitch (50s)** — Production URL is live. Auth, DB, edge functions all by InsForge. Semantic layer by Nia. 11.3% lower hallucination, 1.7x more accurate agents (sponsor stats), no localhost.

## Architecture

```
┌────────────────┐     ┌────────────────┐
│  mockple.app   │     │  mockzon.app   │   <-- Vercel-hosted demo storefronts
│  <script em.js>│     │  <script em.js>│
└──────┬─────────┘     └──────┬─────────┘
       │ POST /events         │ POST /events
       ▼                      ▼
   ┌──────────────────────────────────┐
   │   InsForge Edge Function:        │
   │   /events  (collect)             │
   │   /profile (query)               │
   └──────┬─────────────┬─────────────┘
          │             │
          ▼             ▼
   ┌─────────────┐  ┌──────────┐
   │ InsForge PG │  │   Nia    │
   │  events tbl │  │ indexed  │
   │  users  tbl │  │ profiles │
   └─────────────┘  └────┬─────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Admin Dashboard│
                │  (NL query UI)  │
                └─────────────────┘
```

## User Identity
- **Method:** SHA-256 hash of the email the user is logged in with on the host site.
- The host site passes `email` to `EM.identify(email)`; the script hashes client-side before sending.
- Server stores only the hash. Never raw email.
- Sites with different domains can therefore correlate the same user once both sites have seen the same email.

## Data Model (InsForge Postgres)

### `users`
| column | type | notes |
|---|---|---|
| user_hash | text PK | SHA-256(email) |
| created_at | timestamptz | |
| demographics_json | jsonb | optional (gender, age band, etc.) — set when host site provides |

### `events`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_hash | text FK | |
| site_id | text | e.g., "mockple", "mockzon" |
| event_type | text | "page_view", "product_view", "search", "add_to_cart" |
| properties | jsonb | { product_name, category, price, query, ... } |
| occurred_at | timestamptz | |

### `sites`
| column | type | notes |
|---|---|---|
| site_id | text PK | "mockple" |
| api_key | text | passed to script init |
| display_name | text | |

## Nia Integration
- Each event is appended to a **per-user markdown profile document** (`profile-{user_hash}.md`) with a normalized line:
  `[2026-05-09T14:22Z] mockple: viewed product "iPhone 15 Pro" (category: phones, price: $1199)`
- That markdown doc is registered/refreshed in Nia (Nia Sync daemon or direct upload via Nia API).
- Profile-query endpoint translates a natural-language question into a Nia search over that user's document, returning a synthesized answer + source events.
- **Fallback if Nia indexing latency is too high:** assemble the user's event log inline and pass it as context to a single Anthropic call from the edge function. (Decided at build time depending on Nia daemon availability.)

## Public API

### Script API (browser-side)
```js
EM.init({ apiKey: 'mockple_key_xxx' });
EM.identify('user@example.com');               // auto-hashes to SHA-256
EM.track('product_view', { name: 'iPhone 15', category: 'phones', price: 1199 });
EM.setDemographics({ gender: 'M', ageBand: '25-34' });
```

### REST endpoints (InsForge edge functions)
| Method | Path | Purpose |
|---|---|---|
| POST | `/events` | Append one event. Body: `{ apiKey, userHash, eventType, properties, occurredAt }` |
| POST | `/profile/query` | Body: `{ apiKey, userHash, question }`. Returns `{ answer, sources[] }` via Nia. |
| GET  | `/profile/{userHash}/raw` | Returns recent events (debug / admin only). |

### Auth
- Host sites authenticate via `apiKey` per site (provisioned via InsForge auth on signup).
- The query endpoint additionally requires the requester's `apiKey` so we can audit cross-site reads.

## Acceptance Criteria
- [ ] Live deployed URL (NOT localhost) reachable to a stranger.
- [ ] Two demo sites at distinct URLs, each loading the script from a CDN.
- [ ] Logging in with the same email on both sites produces correlated events in the DB.
- [ ] At least one cross-site personalization is rendered (banner / recommendation).
- [ ] Admin dashboard answers a natural-language question about a user via Nia.
- [ ] Sign-up flow exists for a new "site owner" (site_id + api_key issued).
- [ ] Email is never persisted in raw form (only SHA-256 hash).
- [ ] README has the demo URL, sponsor logos, GitHub link.

## Non-Goals (explicitly cut for time)
- Real third-party cookie / fingerprinting fallback (email-hash only).
- GDPR/CCPA consent UI (mention in README, do not build).
- Real-time websockets (HTTP POST only).
- Production-grade rate limiting / abuse protection.
- Multi-tenant billing.
- Mobile SDK.
- Bulk export / data deletion API.

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Backend (auth, DB, edge fns) | **InsForge** | Sponsor; one-stop full-stack backend |
| Semantic layer | **Nia** | Sponsor; semantic search over per-user markdown profiles |
| Demo sites | **Next.js on Vercel** | Vercel sponsor; cheap free deploy; fastest to ship |
| Admin dashboard | **Next.js on Vercel** (separate route) | same project |
| Script lib | **Vanilla TS, ~3KB** built with `tsup` | Zero deps, embeddable everywhere |
| LLM (NL query synth) | **Claude Haiku 4.5** via Anthropic API | Cheap, fast |

## Risks
| Risk | Mitigation |
|---|---|
| Nia indexing latency > 1 min | Fallback: inline events as context to LLM call |
| InsForge edge fn cold start | Warm via dummy ping at demo start |
| Cross-domain script CORS | Set `Access-Control-Allow-Origin: *` on POST /events |
| Email hash collision (unrealistic but) | SHA-256 is fine |
| Demo email already used in prior test | Reset DB row at demo start |

## Submission Checklist
- [ ] `https://<subdomain>.vercel.app` mockple live
- [ ] `https://<subdomain>.vercel.app` mockzon live
- [ ] Admin dashboard live
- [ ] GitHub repo public
- [ ] Submission form: https://forms.gle/fkoFXRo3L2MVkkz87
- [ ] One team member present 6:10pm
- [ ] README with demo links + sponsor mentions

## Final Ambiguity
14.5% — well below the 20% threshold. Build time.
