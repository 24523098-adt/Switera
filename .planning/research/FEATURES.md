# Feature Research

**Domain:** Backend + multi-user migration for a small internal role-based business app (TBS distribution management)
**Researched:** 2026-06-24
**Confidence:** MEDIUM (cross-corroborated web sources across 12 independent queries; no official framework docs consulted — see Sources)

## Feature Landscape

This research covers ONLY the new v2.0 capability set: turning Switera from a single-browser `localStorage` demo into a genuine multi-user, server-backed app. The existing client-side feature set (city/stock CRUD, request input, ranking-based distribution decisions, status tracking, role-differentiated reporting, activity history, dashboards) is **not** re-researched here — it exists and works. What changes is *where the data lives and who can trust it*.

### Table Stakes (Users Expect These)

For a "real backend" to mean anything beyond a buzzword, these are non-negotiable. Skipping any of them means the migration hasn't actually delivered multi-user trust — it's still a single-user demo with extra network calls.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Persistent server-side database (PostgreSQL via Prisma) | Data must survive across browsers/devices/sessions — the entire point of "real backend" | MEDIUM | One Prisma schema covering `Akun`, `Kota`, `Permintaan`, `Keputusan`, `RiwayatKeputusan`/`ActivityLog`, `Notifikasi` — a direct 1:1 mapping of Switera's existing `state` shape in `store.js` |
| REST API covering every existing data domain | Every page currently reads/writes `store.js` directly; each of those calls needs an HTTP equivalent or the migration is partial | MEDIUM-HIGH | `akun`, `daftarKota`, `permintaan`, `keputusan`, `riwayatKeputusan`, `notifikasi`, `activityLog` — 7 resources, ~30 store methods to re-home as endpoints |
| Password hashing (bcrypt) | Plaintext password storage/matching is the single most basic "this isn't real" tell in any backend demo | LOW | `bcrypt`, 12 salt rounds, async `hash`/`compare`. Replaces `store.cariAkun`'s plaintext string match |
| Server-issued sessions (JWT access token) | The server, not the browser, must be the source of truth for "who is logged in" — otherwise auth is still cosmetic | MEDIUM | Short-lived (~15 min) access token in `Authorization: Bearer` header; verified by middleware on every protected route |
| Server-side role enforcement on every mutating endpoint | Today role gating is UI-only (`App.jsx`'s `allowedPages`) — anyone can call store mutators directly regardless of role. A real backend must close this exact gap | MEDIUM | RBAC middleware: verify JWT → attach `{ userId, role }` to `req` → per-route `requireRole(...)` guard before the controller runs |
| Input validation at the API boundary | Client-side `validate()` functions (Login.jsx, InputData.jsx) are UX-only; without server validation, the API is unsafe for a second client that didn't go through the same form | MEDIUM | Zod schemas per resource, validation middleware factory, 400 + field-level errors on failure — server-side counterpart to existing client validation, not a replacement for it |
| CORS configured correctly for the Vite dev server origin | Frontend (port 5173) and backend (different port) are cross-origin; without this nothing works at all in local dev | LOW | Exact-origin `Access-Control-Allow-Origin` (not `*`) + `Access-Control-Allow-Credentials: true` if using cookie-based auth: required for the app to function, not optional |
| Multi-user concurrent read consistency | Two logged-in users (any combination of roles) must see the same `stokTbs`, `daftarKota`, `permintaan` list — this is the literal definition of "genuine multi-user" in the milestone goal | MEDIUM | Solved automatically by moving the source of truth to the DB + a sync mechanism (see Differentiators); no special feature work beyond "stop reading local state" |
| Foreign-key integrity for cascading operations | `updateKota` (rename) and `hapusKota` (block-if-referenced) already enforce data integrity client-side; a relational DB must enforce the same invariants or worse bugs become possible | MEDIUM | Express FK relations in Prisma schema (`Permintaan.kotaId → Kota.id`, etc.); rename-cascade becomes either an FK with `ON UPDATE CASCADE` semantics handled by keeping a stable `kotaId` (preferred) or an explicit service-layer cascade matching today's `updateKota` logic |
| Migration of seed data into the database | The app currently boots with seeded JSON (`permintaan.json`, `keputusan.json`, `notifikasi.json`, `activityLog.json`, plus in-code `akunSeed`/`kotaSeed`) — this data needs an initial DB state to demo against | LOW-MEDIUM | `prisma/seed.js` reading the existing JSON files, inserting parent rows (`Kota`, `Akun`) before child rows (`Permintaan`, `Keputusan`) to satisfy FK constraints |

### Differentiators (Competitive Advantage — Relative to "Bare Minimum Backend")

These aren't required for the backend to "count," but they are what separates a backend migration that actually delivers the stated UX goal ("instant reflect, no refresh," preserved) from one that technically works but feels like a regression.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Polling-based live sync (short-interval GET on key list endpoints) | Preserves the existing "no manual refresh" UX across multiple clients without WebSocket infrastructure overhead | LOW-MEDIUM | 3-5s interval polling on `permintaan`, `keputusan`, `daftarKota`/`stokTbs`, `notifikasi` endpoints from the pages that display them. Matches the data's actual update cadence (manual form submissions, not high-frequency events) — this is very likely the right call for school-project scale; see PITFALLS.md companion file for the full polling vs WebSocket vs SSE tradeoff |
| Optimistic locking on the stock-allocation path specifically | Prevents the one genuine correctness risk introduced by concurrency: two Manajer Distribusi users approving distributions against the same shrinking `stokTbs` pool at the same time | MEDIUM | Wrap the read-check-decrement of `stokTbs` inside a single Prisma `$transaction` (or a `version`/`updatedAt` optimistic check) specifically in the `addKeputusan`/decision-approval endpoint. Not needed everywhere — just this one race-prone mutation |
| Refresh token (separate from access token) | Lets the access token stay short-lived (good security hygiene) without forcing re-login every 15 minutes | MEDIUM | httpOnly+Secure+SameSite cookie holding a longer-lived refresh token; `/auth/refresh` endpoint mints new access tokens. Full rotation-with-reuse-detection is a stretch goal — a simpler fixed-expiry refresh token is an acceptable simplification at this scope |
| Activity log / notifications generated server-side, not client-side | Once multiple users act concurrently, activity log entries (`pushActivity`) and notifications (`pushNotifikasi`) must be generated by the server processing the mutation, not by whichever browser happened to trigger it locally | LOW-MEDIUM | Move `recordActivity`/`pushNotifikasi` calls from `store.js` into the corresponding service-layer functions server-side; same Indonesian-language activity strings, just emitted from the API instead of the browser |
| API-level resource versioning prefix (`/api/v1/...`) | Costs nothing now, prevents a painful retrofit if the API ever needs a v2 (e.g. for a future mobile client) | LOW | Trivial to add up front; commonly cited as "the migration regret people have most" — purely preventative, near-zero cost |

### Anti-Features (Commonly Requested, Often Problematic at This Scale)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| WebSocket-based real-time push for all data | "Real-time" sounds more impressive / more "real backend" than polling | Adds a stateful connection-management layer, reconnection logic, and scaling considerations for a data-update frequency that's actually low (manual form submissions by ~3 roles, not live telemetry) — disproportionate complexity for a school project | Short-interval polling (see Differentiators); explicitly reserve WebSocket/SSE for a future milestone if a genuinely high-frequency use case emerges |
| Full refresh-token rotation with reuse detection + token blocklist | "Best practice" articles list it as the gold standard for production auth | Requires a persisted token-family/session store, rotation bookkeeping, and replay-detection logic — real engineering effort disproportionate to a 3-account, 3-role school demo | Fixed-expiry refresh token (no rotation), explicitly documented as a known simplification; revisit only if this app were ever deployed beyond the classroom |
| Pessimistic row-locking (`SELECT ... FOR UPDATE`) across the whole API | "Locking prevents races" sounds safer than optimistic approaches | REST is stateless by design; pessimistic locks force server-side session/connection state and create contention for an app with only 3 roles and low write concurrency — solving a problem this app doesn't have | Optimistic locking (transaction-wrapped decrement, or version check) applied narrowly to the one genuinely race-prone path (stock allocation) |
| Microservices / splitting the API by domain into separate deployable services | "Backend" sometimes gets conflated with "distributed system" | Massive overhead for ~7 resources and a single Express process; this is explicitly called out as Out of Scope in PROJECT.md ("Horizontal scaling, caching layers, microservices — unnecessary complexity at this scale") | Single Express app, layered internally (routes → controllers → services → Prisma), one deployable unit |
| Moving the ranking/recommendation UI rendering logic server-side (not just the calculation) | Conflating "server should own business logic" with "server should own everything" | Chart rendering (Chart.js), table display, and form interactivity are legitimately client-side concerns; pushing them server-side (e.g. server-rendered HTML fragments) would be a frontend architecture rewrite explicitly out of scope ("no rewrite of existing pages/components beyond what's needed to call the new API") | Server computes and returns ranking/allocation *data*; React continues to own all rendering, exactly as today, just sourced from `fetch()` instead of `store.getDaftarKota()` |
| Real-time collaborative editing (e.g. operational-transform conflict resolution on form fields) | Sounds like "true multi-user" | No requirement in PROJECT.md calls for simultaneous co-editing of the same record; this is solving for Google-Docs-style collaboration the app doesn't need | Last-write-wins for most resources; optimistic-locking conflict response (409, "ask user to retry") only where it matters (stock allocation) |
| Generic CRUD-generator / admin-panel framework (e.g. AdminJS, Forest Admin) to "save time" | Looks like it would shortcut a lot of backend boilerplate | Existing UI is fully built and intentionally not to be touched ("Design system: No changes to `src/components/*`... this milestone is backend/data-layer only"); a generated admin panel doesn't compose with that constraint and adds a dependency with its own learning curve | Hand-written Express routes/controllers per resource, matching the existing `store.js` method surface 1:1 |

## Feature Dependencies

```
PostgreSQL + Prisma schema (data model)
    └──requires──> Seed-data migration (prisma/seed.js from existing JSON)
                       └──enables──> REST API endpoints (per resource)
                                         └──requires──> Input validation middleware (Zod)
                                         └──requires──> Server-side role enforcement (RBAC middleware)
                                                            └──requires──> JWT auth (login/issue token)
                                                                              └──requires──> bcrypt password hashing
                                                                              └──enhances──> Refresh token flow (optional layer on top)

REST API endpoints
    └──enables──> Frontend API client layer (replacing direct store.js calls)
                      └──requires──> CORS configuration (Express ↔ Vite dev server)
                      └──enables──> Polling-based live sync (multi-client "instant reflect")

Ranking/recommendation engine (computeRekomendasiDistribusi, currently src/utils/distribusi.js)
    └──MUST MOVE server-side──> once permintaan/stokTbs/daftarKota are shared, authoritative API data
                                    └──conflicts with──> keeping the calculation purely client-side (client copies can be stale/tamperable)

Stock allocation (addKeputusan mutating stokTbs)
    └──requires──> Optimistic locking / transaction (prevents two concurrent approvals racing on stokTbs)

Activity log + notification generation (pushActivity, pushNotifikasi)
    └──MUST MOVE server-side──> alongside the mutations that trigger them, once multiple browsers can trigger the same mutation
```

### Dependency Notes

- **REST API requires JWT auth, which requires bcrypt:** there is no meaningful order to deliver these independently — auth has to land as one coherent slice (hash passwords → issue tokens → verify tokens → gate routes) before any "logged in as role X" feature is real.
- **Role enforcement requires JWT auth:** RBAC middleware needs `req.user.role`, which only exists once the JWT-verification middleware runs first. These are sequential, not parallel.
- **Frontend API client layer requires REST API endpoints to exist first**, but per-resource it can be done domain-by-domain (e.g. ship `kota` endpoints + frontend swap before `permintaan` endpoints exist) — this is the natural phase-boundary seam.
- **The ranking engine (`computeRekomendasiDistribusi` in `src/utils/distribusi.js`) MUST move server-side once multi-user is real.** It is currently pure, dependency-free JS that reads `permintaan`, `daftarKota`, and `stokTbs` passed in as arguments — today these always come from one browser's own local state, so it's trivially "consistent." Once two Manajer Distribusi users can be logged in simultaneously, each browser's local copy of `permintaan`/`stokTbs` can be stale relative to the other's, and the recommendation + allocation has real business effect (committing remaining stock). The function's pure, stateless design actually makes this move *low-risk*: it can be lifted nearly verbatim into a service-layer module and called by an API endpoint instead of directly by a React component — no rewrite of the algorithm itself, just a change of caller.
- **Supporting pure-math utilities can stay client-side or move — they're not the risk.** `aggregatePermintaanRanking`, `computeKpiMetrics`, date/period-range helpers in `distribusi.js` and `forecast.js` are read-only/display-oriented (dashboard KPIs, chart inputs). These can remain client-side, computed from whatever data the API just returned, *as long as they're not also being used to gate a real mutation*. Only the recommendation-with-allocation function carries an actual business decision and must be authoritative server-side; the rest is presentation logic that's fine to keep where it is for a "no rewrite beyond what's needed" migration.
- **Activity log and notification generation must move alongside their triggering mutations, not as a separate phase.** `pushActivity`/`pushNotifikasi` are currently called inline inside `store.js` mutators (e.g. `addPermintaan` triggers a notification). When `addPermintaan` becomes a POST endpoint, the notification/activity-log side effects move with it into the same service function — there's no clean way to split "do the mutation" from "log the mutation" across the client/server boundary without losing the guarantee that every mutation is logged exactly once.
- **Polling enhances, does not require, the REST API** — the API is fully usable (and demoable) via simple request/response without any polling at all; polling is purely what restores the "no manual refresh" feel across multiple simultaneous clients. It can be the very last piece added, after every resource's CRUD is working end-to-end via plain fetch/refetch-on-action.
- **Optimistic locking on stock allocation conflicts with, and should replace, no concurrency control at all** on that specific endpoint — but does not need to be generalized to every other resource. Applying it everywhere is the "anti-feature" version of this (see Pessimistic locking entry above, same overreach risk in the optimistic direction).

## MVP Definition

### Launch With (v2.0 core — required for "real backend" to be true)

- [ ] PostgreSQL schema (Prisma) covering all 7 existing data domains — without this nothing else has anywhere to live
- [ ] Seed script populating the DB from existing JSON/seed constants — needed to demo against realistic data on day one
- [ ] bcrypt password hashing + JWT issuance on login — the literal definition of "server-side auth" in PROJECT.md's Active requirements
- [ ] REST endpoints for every resource (`akun`, `kota`, `permintaan`, `keputusan`, `riwayatKeputusan`/`activityLog`, `notifikasi`) with full CRUD parity to existing `store.js` methods
- [ ] JWT-verification + role-check middleware enforced server-side on every mutating route — this is the actual multi-user trust boundary; without it, "multi-user" is cosmetic exactly like today's client-only role gating
- [ ] Server-side input validation (Zod) mirroring existing client-side `validate()` logic — the server becomes the real trust boundary, client validation stays for UX
- [ ] Ranking/recommendation engine (`computeRekomendasiDistribusi`) moved server-side, called by the decision-approval endpoint
- [ ] Frontend swapped from direct `store.js` reads/writes to API calls, page-by-page, preserving all existing UI/UX exactly as-is
- [ ] CORS configured correctly between Vite dev server and Express

### Add After Core Works (v2.0 polish, still within this milestone)

- [ ] Polling-based sync on list-heavy pages (`Dashboard`, `KeputusanDistribusi`, `StatusDistribusi`, notifications) to restore "instant reflect, no refresh" across multiple logged-in clients — add once single-client API integration is proven correct
- [ ] Optimistic locking / transaction-wrapped stock decrement on the decision-approval endpoint — add once the basic approve/cancel flow works against the API, harden it for concurrency last
- [ ] Refresh token flow — add once short-lived-access-token-only auth is proven to work; refresh is a UX nicety (avoid forced 15-min re-login) layered on top of a working baseline

### Future Consideration (beyond this milestone's scope, per PROJECT.md Out of Scope)

- [ ] Refresh-token rotation with reuse detection — overkill at school-project scale, defer indefinitely
- [ ] WebSocket/SSE push instead of polling — only revisit if the data-update frequency genuinely changes (e.g. real production deployment with high request volume)
- [ ] CI/CD, horizontal scaling, caching layers, microservices — explicitly out of scope per PROJECT.md

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Prisma/PostgreSQL schema + seed migration | HIGH | MEDIUM | P1 |
| bcrypt + JWT auth (access token, role middleware) | HIGH | MEDIUM | P1 |
| REST endpoints for all 7 resources | HIGH | HIGH | P1 |
| Server-side input validation (Zod) | HIGH | MEDIUM | P1 |
| Ranking engine moved server-side | HIGH | LOW (logic already pure/portable) | P1 |
| Frontend API client swap (per page) | HIGH | HIGH | P1 |
| CORS configuration | HIGH (blocking) | LOW | P1 |
| Polling-based multi-client sync | MEDIUM-HIGH (UX preservation) | LOW-MEDIUM | P2 |
| Optimistic locking on stock allocation | MEDIUM (correctness under concurrency) | MEDIUM | P2 |
| Refresh token flow | MEDIUM (UX nicety) | MEDIUM | P2 |
| API versioning prefix (`/api/v1`) | LOW now, HIGH if ever extended | LOW | P3 |
| Refresh-token rotation + reuse detection | LOW at this scale | HIGH | P3 (defer) |
| WebSocket/SSE real-time push | LOW at this scale | HIGH | P3 (defer) |

**Priority key:**
- P1: Must have — without these the migration hasn't delivered a real backend or real multi-user support
- P2: Should have — needed to preserve the existing UX quality bar and avoid one specific known correctness risk
- P3: Nice to have / explicitly deferred — documented anti-features or low-value-at-this-scale additions

## Sources

All findings below are MEDIUM confidence (multiple independent web sources corroborating the same claim; no official vendor documentation directly consulted in this research pass — recommend validating against official Prisma/Express/jsonwebtoken docs during phase planning/implementation). No curated MCP search providers (Exa, Brave, Tavily, Firecrawl) were configured for this project (`.planning/config.json` has all four flags `false`); research relied on the built-in `WebSearch` tool, cross-checked across ~9-11 results per query.

- JWT auth patterns: [GeeksforGeeks – JWT Authentication With Refresh Tokens](https://www.geeksforgeeks.org/node-js/jwt-authentication-with-refresh-tokens/), [freeCodeCamp – Secure Authentication System with JWT and Refresh Tokens](https://www.freecodecamp.org/news/how-to-build-a-secure-authentication-system-with-jwt-and-refresh-tokens/), [BezKoder – JWT Refresh Token implementation in Node.js](https://www.bezkoder.com/jwt-refresh-token-node-js/)
- bcrypt practices: [Honeybadger – Password hashing in Node.js with bcrypt](https://www.honeybadger.io/blog/node-password-hashing/), [freeCodeCamp – How to Hash Passwords with bcrypt in Node.js](https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/), [LogRocket – Password hashing in Node.js with bcrypt](https://blog.logrocket.com/password-hashing-node-js-bcrypt/)
- RBAC middleware patterns: [marmelab – Add Role-Based Access Control On Top Of Your REST API](https://marmelab.com/blog/2025/10/16/rbac-rest-middleware.html), [Permify – Implementing RBAC in Node.js and Express](https://permify.co/post/role-based-access-control-rbac-nodejs-expressjs/), [Auth0 – Express.js API Role-Based Access Control sample](https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control)
- Prisma + PostgreSQL schema/seeding: [Prisma Docs – Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding), [Prisma Docs – Prisma schema overview](https://www.prisma.io/docs/orm/prisma-schema/overview), [Better Stack – Getting Started with Prisma ORM for Node.js and PostgreSQL](https://betterstack.com/community/guides/scaling-nodejs/prisma-orm/)
- Optimistic vs pessimistic locking: [binaryigor – Optimistic vs Pessimistic Locking](https://binaryigor.com/optimistic-vs-pessimistic-locking.html), [4PSA – REST Best Practices: Managing Concurrent Updates](https://blog.4psa.com/rest-best-practices-managing-concurrent-updates/), [Medium – API Concurrency Control Strategies](https://medium.com/swlh/api-concurrency-control-strategies-cd546c2cdc16)
- Polling/SSE/WebSocket tradeoffs: [RxDB – WebSockets vs SSE vs Long-Polling vs WebRTC vs WebTransport](https://rxdb.info/articles/websockets-sse-polling-webrtc-webtransport.html), [algomaster – Polling vs Long Polling vs SSE vs WebSockets vs Webhooks](https://blog.algomaster.io/p/polling-vs-long-polling-vs-sse-vs-websockets-webhooks), [DEV – WebSockets vs SSE vs Polling: A Full Stack Developer's Guide](https://dev.to/crit3cal/websockets-vs-server-sent-events-vs-polling-a-full-stack-developers-guide-to-real-time-3312)
- Client vs server business-logic placement: [Dreamfactory – APIs and Business Logic: What's the Connection?](https://blog.dreamfactory.com/apis-and-business-logic), [Medium – Striking the Balance: Dividing Business Logic Between UI and API](https://piyushranjanxt.medium.com/striking-the-balance-dividing-business-logic-between-ui-and-api-for-optimal-web-application-design-c533c3466d27)
- localStorage-to-API migration pitfalls: [Zuplo – Common Pitfalls in RESTful API Design](https://zuplo.com/learning-center/common-pitfalls-in-restful-api-design), [group107 – 10 Essential REST API Security Best Practices for 2025](https://group107.com/blog/rest-api-security-best-practices/)
- CORS + JWT + SPA pitfalls: [SuperTokens – What causes CORS errors](https://supertokens.com/blog/cors-errors), [ianlondon – Please Don't Use JSON Web Tokens for Browser Sessions](https://ianlondon.github.io/posts/dont-use-jwts-for-sessions/), [DEV – How to Secure JWT in a Single-Page Application](https://dev.to/nilanth/how-to-secure-jwt-in-a-single-page-application-cko)
- Prisma transactions/race conditions: [Prisma Docs – Transactions and batch queries](https://www.prisma.io/docs/orm/prisma-client/queries/transactions), [Medium – 10 Prisma Transaction Patterns That Avoid Deadlocks](https://medium.com/@connect.hashblock/10-prisma-transaction-patterns-that-avoid-deadlocks-4f52a174760b), [GitHub prisma/prisma Discussion #24874 – optimistic concurrency without a version field](https://github.com/prisma/prisma/discussions/24874)
- Zod/Express validation: [UserJot – How to use Zod with Express for input validation?](https://userjot.com/blog/zod-express-input-validation), [Medium – API Input Validation (NodeJs + ExpressJs + Zod)](https://medium.com/@elijahechekwu/api-input-validation-nodejs-expressjs-zod-9616f7f219e3)
- Express layered architecture: [Treblle – How to structure an Express.js REST API with best practices](https://treblle.com/blog/egergr), [Corey Cleary – Project structure for an Express REST API when there is no "standard way"](https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way), [DEV – Bulletproof node.js project architecture](https://dev.to/santypk4/bulletproof-node-js-project-architecture-4epf)
- Existing codebase (read directly, not researched): `C:\Users\acer\Switera\src\store.js`, `C:\Users\acer\Switera\src\utils\distribusi.js`, `C:\Users\acer\Switera\.planning\PROJECT.md`

---
*Feature research for: Switera v2.0 — Backend & Multi-User Migration*
*Researched: 2026-06-24*
