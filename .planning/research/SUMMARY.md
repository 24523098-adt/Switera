# Project Research Summary

**Project:** Switera v2.0 — Backend & Multi-User Migration
**Domain:** Migrating a client-only React SPA (localStorage singleton store) to a real Node.js/Express/PostgreSQL backend with JWT auth and genuine multi-user concurrency
**Researched:** 2026-06-24
**Confidence:** MEDIUM-HIGH

## Executive Summary

Switera v2.0 is not a rewrite — it's a transport-layer migration. Experts building this kind of "add a real backend to an existing localStorage SPA" project converge on the same shape: a thin Express + Prisma + PostgreSQL API that mirrors the existing `store.js` method surface 1:1, JWT/bcrypt auth replacing plaintext checks, server-side role enforcement closing the cosmetic-only authorization gap that exists today, and short-interval polling (not WebSockets) to restore the "instant reflect, no refresh" UX across multiple simultaneous users. The recommended frontend pattern is "store-as-seam": keep every `store.js` method name and the existing `subscribe`/`notify` pub-sub contract exactly as-is, and only change the internals from synchronous array mutation to async `fetch` calls. This satisfies the project's explicit constraint of no rewrite beyond what's needed to call the new API, and reuses the one mechanism that already gives Switera its "feels instant" UX.

The single biggest risk is not technical novelty — it's that this codebase has **zero loading states and zero error-handling UI anywhere**, because nothing has ever been able to fail or take time before. Every one of the ~12 pages assumes synchronous, always-succeeds calls. The moment those become network requests, every call site can be slow or fail with no existing UI pattern to surface it — this must be solved once, early, as a cross-cutting concern (reusing the existing `Toast.jsx` and a new shared `LoadingState` component), not discovered page-by-page. The second major risk cluster is concurrency: the existing "check-then-act" decision-approval flow (`KeputusanDistribusi.jsx`) is a textbook TOCTOU race that becomes a real double-allocation bug the instant two users can act concurrently, and the ranking/recommendation engine must move server-side together with its input reads — moving only the calculation while the frontend still feeds it stale cached data is the most subtle failure mode identified.

The recommended stack is deliberately minimal for a school-project timeline: Express 5.x, Prisma 6.x (pinned, not 7.x — see stack warning), PostgreSQL, JWT (`jsonwebtoken`), bcryptjs, and plain polling. Socket.io, refresh-token rotation, pessimistic locking, and microservices are explicitly identified as anti-features at this scale — disproportionate complexity for ~3 roles, a handful of concurrent users, and a fixed school-project deadline.

## Key Findings

### Recommended Stack

Express 5.x + Prisma 6.x (pinned to `6.19.2`, NOT `latest`/7.x which emits TypeScript-only output) + PostgreSQL is the consensus stack for a small relational REST API matching Switera's existing kota/permintaan/keputusan/akun domain model. Auth uses `jsonwebtoken` for JWT issuance/verification and `bcryptjs` (pure JS, no native compilation — avoids Windows node-gyp build-tool friction) over native `bcrypt`. Multi-user sync uses plain short-interval (3-5s) polling reusing the same REST+JWT infrastructure, not Socket.io — explicitly deferred as an upgrade path only if a future sub-second collaboration requirement emerges.

**Core technologies:**
- Express ^5.2.1 — HTTP/REST API framework — minimal, unopinionated, largest community/tutorial coverage for an unblocking-fast school timeline
- Prisma ORM ^6.19.2 (pin exactly, no caret) — type-safe ORM/migrations over PostgreSQL — declarative schema matches the existing domain model directly; v7 is TypeScript-only and breaks this all-JS codebase
- PostgreSQL 16.x/17.x — relational database — clear FK relationships across cities/requests/decisions/accounts, no NoSQL flexibility needed
- jsonwebtoken ^9.0.3 — JWT signing/verification — replaces plaintext localStorage "session" with real signed, expiring tokens
- bcryptjs ^3.0.3 — password hashing — pure JS, installs cleanly on Windows dev machines without build tools

### Expected Features

This migration changes where data lives and who can trust it, not the existing client-side feature set (which already works and is out of scope here).

**Must have (table stakes):**
- Persistent PostgreSQL database via Prisma, covering all 7 existing data domains (Akun, Kota, Permintaan, Keputusan, RiwayatKeputusan/ActivityLog, Notifikasi)
- REST API with full CRUD parity to ~30 existing `store.js` methods
- bcrypt password hashing + JWT-issued sessions, replacing plaintext `cariAkun` matching
- Server-side role enforcement (RBAC middleware) on every mutating route — closing the exact UI-only gap that exists today
- Server-side input validation (Zod) at the API boundary
- CORS configured correctly for the Vite dev server origin
- Seed-data migration porting existing JSON/seed constants into the DB

**Should have (competitive/UX-preserving):**
- Short-interval (3-5s) polling-based sync to preserve "no manual refresh" across multiple clients
- Optimistic locking / transaction-wrapped stock decrement specifically on the decision-approval endpoint (the one genuinely race-prone mutation)
- Refresh token (httpOnly cookie) layered on top of a working short-lived-access-token baseline
- Server-side activity log/notification generation moved alongside the mutations that trigger them

**Defer (out of scope this milestone):**
- WebSocket/SSE real-time push
- Refresh-token rotation with reuse detection
- Pessimistic row-locking across the whole API
- Microservices / split deployments
- Generic CRUD-generator/admin-panel frameworks

### Architecture Approach

Keep `store.js` as the frontend's single seam to the backend ("store-as-seam" pattern): same exported method names and the same subscribe/notify pub-sub contract, but every method body becomes an async function calling a new `src/api/client.js` wrapper instead of mutating a local array + localStorage. This minimizes the page-level diff across all 12 pages (most only need an added await and a loading flag) and preserves the exact mechanism that already gives "instant reflect, no refresh." On the backend, a standard layered Express structure (routes → middleware → controllers → services → Prisma) ports `store.js`'s existing business rules (duplicate checks, cascade-rename, block-delete-if-referenced) nearly verbatim from JS array ops to Prisma queries.

**Major components:**
1. `src/store.js` (modified internals only) — frontend's single seam to the backend; async wrapper around fetch, same public API
2. `server/` (new sibling root) — Express app with routes/middleware/controllers/services layering, its own package.json
3. `prisma/schema.prisma` + PostgreSQL — declarative relational model replacing localStorage as source of truth
4. `middleware/authenticate.js` + `authorize.js` — JWT verification and per-route role enforcement, the real (not cosmetic) trust boundary
5. `src/hooks/usePolling.js` (used inside store.js) — interval-based refetch driving notify() for cross-client sync, reusing the existing App.jsx subscription unchanged

### Critical Pitfalls

1. **Check-then-act race on decision approval** — KeputusanDistribusi.jsx's read-then-write flow is a TOCTOU bug waiting to surface; fix with a DB unique constraint or prisma.$transaction wrapping the check+write atomically, not two sequential calls.
2. **Zero loading/error UI anywhere today** — every page assumes instant, infallible calls; must engineer optimistic updates + rollback-on-error + the existing Toast.jsx / a new shared LoadingState component as a first-class cross-cutting concern in the very first phase that wires any page to the API.
3. **UI-only role gating "moved" into the JWT without a real server-side re-check** — adding role to the JWT payload is not authorization; every mutating Express route needs its own requireRole(...) middleware independent of what the frontend hides.
4. **Recommendation engine moved server-side in name only** — computeRekomendasiDistribusi must move together with its input reads (fresh from Postgres, inside the same request); the decision-save endpoint must independently revalidate stock/allocation server-side, never trust a client-computed number.
5. **Seed accounts hashed "later"** — bcrypt must be in the very first version of login/register; there is no acceptable intermediate plaintext state once a real backend exists.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Backend Skeleton & Data Model
**Rationale:** Zero frontend risk; establishes the durable source of truth before anything depends on it. Dependency-ordered (Kota before Permintaan/Keputusan, which reference it).
**Delivers:** server/ Express app skeleton, Prisma schema for all 6 collections, migrations, seed script porting src/data/*.json (with bcrypt-hashed seed accounts from the start), verified via Postman/curl only.
**Addresses:** Persistent database, seed-data migration (FEATURES.md table stakes).
**Avoids:** Pitfall — plaintext seed accounts "hashed later."

### Phase 2: Auth & Authorization (JWT + RBAC)
**Rationale:** Unblocks every other route; highest-risk/highest-value piece per PROJECT.md's named milestone goal. Must ship role middleware in the same phase as JWT issuance, not as a follow-up.
**Delivers:** /api/auth/register, /api/auth/login, authenticate/authorize middleware, bcrypt hash/compare.
**Uses:** jsonwebtoken, bcryptjs (STACK.md).
**Implements:** middleware/auth.js (ARCHITECTURE.md).
**Avoids:** Pitfall 3 (UI-only gating relocated, not fixed) — verification must include a curl-bypass test per role.

### Phase 3: Domain CRUD Endpoints (Kota then Permintaan then Keputusan then ActivityLog/Notifikasi)
**Rationale:** Follows the dependency order already visible in store.js; Keputusan (decision approval) is the highest-priority concurrent-write endpoint and must be designed with a transaction/unique-constraint from the start.
**Delivers:** Routes/controllers/services per resource, Zod validation, the recommendation engine (computeRekomendasiDistribusi) moved server-side with fresh input reads, optimistic-locking on the stock-allocation path.
**Addresses:** REST API parity, server-side validation, ranking engine migration (FEATURES.md P1 items).
**Avoids:** Pitfall 1 (TOCTOU race on decision approval) and Pitfall 4 (stale-input recommendation).

### Phase 4: Frontend API-Client Integration & Loading/Error UX
**Rationale:** This is where the "zero loading/error states" risk must be solved once, as a cross-cutting pattern, before any page ships inconsistently. Convert store.js internals method-by-method, matching the Kota then Permintaan then Keputusan order from Phase 3, so each collection's pages can be tested in isolation.
**Delivers:** src/api/client.js, async store.js internals (Pattern 1: store-as-seam), shared LoadingState component, reused Toast.jsx error surfaces, per-page optimistic update + rollback pattern.
**Implements:** Store-as-seam architecture pattern (ARCHITECTURE.md).
**Avoids:** Pitfall 2 (silent failure / no pending-state UX) — this is the single most visible "looks unfinished" risk for the project's core value.

### Phase 5: Multi-Client Sync (Polling) & Cross-Role UAT
**Rationale:** Polling is purely additive on top of an already-working async store.js — adding it last avoids conflating "is data wrong because of polling, or because the underlying fetch is wrong." Final phase mirrors the project's existing practice of a full cross-role manual pass.
**Delivers:** setInterval-driven refetch + notify() loop inside store.js, reusing the unchanged App.jsx subscription; final UAT specifically re-testing the authorization-bypass scenario from Phase 2 and the concurrent-approval scenario from Phase 3.
**Addresses:** "Instant reflect" parity across multiple simultaneous users (FEATURES.md differentiator).

### Phase Ordering Rationale

- Backend-before-frontend sequencing keeps frontend risk at zero until the API is proven correct standalone (curl/Postman), matching the "safest build order" identified in ARCHITECTURE.md.
- Auth must land as one coherent slice before any other route is meaningful — role enforcement requires JWT verification to run first, these are sequential dependencies, not parallelizable (FEATURES.md dependency graph).
- Domain CRUD follows store.js's own dependency order (Kota then Permintaan then Keputusan then logs), letting each collection be tested before the next is converted — this also bounds the blast radius of any single phase's regressions.
- Loading/error UX is deliberately its own phase, not distributed across domain phases, because the research is explicit that this must be one consistent pattern decided up front, not invented per-page.
- Polling is ordered last because every pitfall source agrees it's additive and should not be debugged simultaneously with the underlying fetch logic.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Auth):** Refresh-token strategy (full rotation vs. fixed-expiry single token) is an explicitly open decision in STACK.md/FEATURES.md — needs to be settled before implementation.
- **Phase 3 (Domain CRUD, specifically Keputusan):** The exact concurrency-control mechanism (unique constraint vs. interactive transaction) for the decision-approval endpoint needs concrete schema design decisions, not just the pattern named in PITFALLS.md.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backend skeleton):** Express + Prisma + PostgreSQL setup is extremely well-documented (official Prisma docs cited as HIGH confidence); standard scaffolding.
- **Phase 4 (Frontend integration):** Store-as-seam is a well-reasoned, single recommended pattern with no live ambiguity — implementation is mechanical once Phase 3 endpoints exist.
- **Phase 5 (Polling):** Trivial setInterval + fetch pattern, explicitly de-risked by deferring it to last.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Package versions cross-verified directly against live npm registry; architectural claims corroborated across 2+ independent sources each |
| Features | MEDIUM | Cross-corroborated web sources across 12 queries; no official framework docs consulted directly for feature-landscape claims |
| Architecture | MEDIUM (codebase facts HIGH) | Codebase facts verified by direct reading (HIGH); external best-practice claims cross-checked across 3+ sources (MEDIUM) |
| Pitfalls | MEDIUM | Cross-verified against well-established, multiply-corroborated patterns (TOCTOU, JWT authz, async-UI); no project-specific incident exists, so findings are general patterns applied to this codebase, not verified against a live failure |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Refresh-token strategy** (single short-lived JWT with re-login vs. httpOnly-cookie refresh flow) is explicitly left as an open decision across STACK.md, FEATURES.md, and ARCHITECTURE.md — must be settled during Phase 2 planning, not assumed.
- **Concurrency-control mechanism for decision approval** (DB unique constraint vs. Prisma interactive transaction) — PITFALLS.md recommends the constraint approach but the exact schema design (e.g., partial unique index on kota_tujuan where status != 'selesai') needs to be finalized during Phase 3 planning.
- **No official Express/jsonwebtoken/Zod vendor docs were directly consulted** in FEATURES.md (relied on community sources) — worth a quick official-docs check during Phase 2/3 implementation if any ambiguity arises.
- **Polling interval value** (3-5s recommended consistently, but not load-tested) — acceptable to ship with 5-7s default and tune later; no further research needed given school-project scale.

## Sources

### Primary (HIGH confidence)
- Prisma official docs (prisma.io/docs) — schema overview, models/relations, seeding, transactions
- npm registry (registry.npmjs.org) — direct version verification for all recommended packages
- Direct codebase inspection — src/store.js, src/App.jsx, src/utils/distribusi.js, src/pages/KeputusanDistribusi.jsx, .planning/codebase/ARCHITECTURE.md, .planning/codebase/CONCERNS.md, .planning/PROJECT.md

### Secondary (MEDIUM confidence)
- JWT/refresh-token patterns — GeeksforGeeks, freeCodeCamp, BezKoder, codevoweb
- bcrypt/bcryptjs tradeoffs — Honeybadger, LogRocket, multiple DEV.to/Medium comparisons
- RBAC middleware patterns — marmelab, Permify, Auth0
- Polling vs. WebSocket vs. SSE tradeoffs — RxDB, algomaster, DEV Community
- TOCTOU / optimistic vs. pessimistic locking — Wikipedia, Kevin Sookocheff, multiple Medium writeups
- Express project structure — Treblle, Corey Cleary, oneuptime, DEV Community

### Tertiary (LOW confidence)
- None flagged — all findings were cross-corroborated across at least 2 independent sources per claim.

---
*Research completed: 2026-06-24*
*Ready for roadmap: yes*
