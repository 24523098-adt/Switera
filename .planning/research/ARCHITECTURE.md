# Architecture Research

**Domain:** Migrating a client-only React SPA (localStorage singleton store) to a Node.js/Express/PostgreSQL/Prisma backend with real multi-user auth
**Researched:** 2026-06-24
**Confidence:** MEDIUM (codebase facts are HIGH/verified-by-reading; external best-practice claims are MEDIUM, cross-checked across 3+ independent sources per topic — see Sources)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 18 + Vite)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ Dashboard  │  │ InputData  │  │ Keputusan  │  │  ...8 more │         │
│  │   .jsx     │  │   .jsx     │  │Distribusi  │  │   pages    │         │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │
│        │  import store from "../store" — UNCHANGED CALL SITES           │
│        └────────────────┴────────────────┴────────────────┘             │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  src/store.js — SAME public method names, NEW internals          │   │
│  │  • subscribe/listeners/notify  → kept, now also drives polling    │   │
│  │  • getX()/addX()/updateX()     → become async, return Promises    │   │
│  │  • new: getState() returns last-known cache, not live truth       │   │
│  │  • new: loading/error fields surfaced per-domain to subscribers   │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                                │ fetch() + JWT in Authorization header    │
└────────────────────────────────┼──────────────────────────────────────────┘
                                  ▼ HTTPS (dev: localhost:5173 → localhost:3000)
┌──────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS API (new, port 3000)                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ routes/    │→ │ middleware/  │→ │ controllers/ │→ │  services/     │ │
│  │ (wiring)   │  │ authenticate │  │ (req/res     │  │ (business      │ │
│  │            │  │ + authorize  │  │  shaping)    │  │  logic, txns)  │ │
│  └────────────┘  └──────────────┘  └──────────────┘  └───────┬────────┘ │
│                                                                │          │
│                                              ┌─────────────────▼───────┐ │
│                                              │   Prisma Client          │ │
│                                              │   (schema.prisma models) │ │
│                                              └─────────────┬────────────┘ │
└───────────────────────────────────────────────────────────┼──────────────┘
                                                              ▼
                                              ┌────────────────────────────┐
                                              │   PostgreSQL               │
                                              │   Akun/Kota/Permintaan/    │
                                              │   Keputusan/ActivityLog/   │
                                              │   Notifikasi                │
                                              └────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `src/store.js` (modified) | Frontend's single seam to the backend; same method names pages already call | Async wrapper around `fetch`; keeps `subscribe`/`notify` pub-sub but now fed by polling + post-mutation refetch instead of pure local mutation |
| `routes/*.js` (new) | Declare URL → handler mapping per domain (akun, kota, permintaan, keputusan, activity) | `express.Router()` per resource, mounted in `app.js`, no logic inside |
| `middleware/auth.js` (new) | Verify JWT, attach `req.user`; enforce role via `authorize(...roles)` | `jsonwebtoken.verify` + a small role-allowlist check, 401/403 on failure |
| `controllers/*.js` (new) | Translate HTTP req/res ↔ service calls; validation entry point | Thin: destructure `req.body`/`req.params`, call service, `res.json(...)` |
| `services/*.js` (new) | Business logic ported from `store.js` mutators (duplicate checks, cascades, activity logging) | Plain async functions calling Prisma; this is where `tambahKota`'s duplicate-name check and `updateKota`'s cascade-rename move to |
| `prisma/schema.prisma` (new) | Declarative relational model definitions | One model per current store collection, with real foreign keys |
| PostgreSQL (new) | Durable, multi-client shared data store | Replaces `window.localStorage` as source of truth |

## Recommended Project Structure

```
Switera/
├── src/                        # EXISTING — React frontend, mostly untouched
│   ├── pages/                  # UNCHANGED call sites: store.addPermintaan(...) etc.
│   ├── components/              # UNCHANGED (Layout.jsx still reads store directly)
│   ├── store.js                 # MODIFIED — internals only, public API preserved
│   ├── api/                     # NEW — thin fetch wrapper, isolated from store.js logic
│   │   └── client.js             # NEW — baseURL, attaches Authorization header, parses errors
│   └── hooks/
│       └── usePolling.js         # NEW — interval-based refetch hook used inside store.js
├── server/                      # NEW — everything backend-related lives in its own root
│   ├── prisma/
│   │   ├── schema.prisma         # NEW — Akun, Kota, Permintaan, Keputusan, ActivityLog, Notifikasi
│   │   ├── migrations/           # NEW — generated by `prisma migrate dev`
│   │   └── seed.js               # NEW — ports src/data/*.json into Prisma `create` calls
│   ├── src/
│   │   ├── app.js                 # NEW — Express app wiring, mounts routers + global error handler
│   │   ├── server.js              # NEW — `app.listen(...)`, separate from app.js for testability
│   │   ├── routes/
│   │   │   ├── auth.routes.js      # NEW — /api/auth/login, /register
│   │   │   ├── kota.routes.js       # NEW — /api/kota
│   │   │   ├── permintaan.routes.js # NEW — /api/permintaan
│   │   │   ├── keputusan.routes.js  # NEW — /api/keputusan
│   │   │   └── activity.routes.js   # NEW — /api/activity-log
│   │   ├── controllers/           # NEW — one file per routes file, same naming
│   │   ├── services/               # NEW — ports store.js mutator logic 1:1
│   │   ├── middleware/
│   │   │   ├── authenticate.js      # NEW — verifies JWT, sets req.user
│   │   │   ├── authorize.js          # NEW — role allowlist guard
│   │   │   └── errorHandler.js       # NEW — global try/catch replacement
│   │   ├── lib/
│   │   │   └── prisma.js           # NEW — singleton PrismaClient instance
│   │   └── utils/
│   │       └── jwt.js               # NEW — sign/verify helpers
│   ├── .env                       # NEW — DATABASE_URL, JWT_SECRET (gitignored)
│   └── package.json               # NEW — separate from frontend's package.json
├── package.json                 # EXISTING frontend — unchanged scripts
└── vite.config.js                # MODIFIED — add dev proxy: /api → localhost:3000
```

### Structure Rationale

- **`server/` as a sibling root, not nested inside `src/`:** Keeps the existing frontend `package.json`/`vite.config.js`/build untouched; the backend gets its own `package.json`, its own `node_modules`, and can be run/deployed independently. This matches the project's explicit constraint that frontend tech stack "stays as-is."
- **`src/api/client.js` as a new, separate module from `store.js`:** `store.js` should call into `api/client.js` for the actual HTTP work (auth header attachment, base URL, JSON parsing, error normalization) rather than embedding `fetch` calls inline — this keeps `store.js` readable and the HTTP plumbing testable/swappable in isolation.
- **Routes/Controllers/Services split on the backend:** Routes contain zero logic (just wiring); Controllers only shape req/res; Services hold the business rules — this is where the bulk of `store.js`'s existing logic (duplicate-city check, cascade-rename, duplicate-permintaan check, status-change-triggers-notification) is ported almost verbatim, just converted from synchronous in-memory array ops to `await prisma.x.findMany(...)` calls.
- **`prisma/seed.js` ports `src/data/*.json` directly:** The existing seed JSON files are the actual source of truth for initial data — convert them to Prisma `createMany` calls rather than redesigning the data from scratch, preserving Indonesian field names and existing ID-prefix conventions (`PMT-`, `KPT-`, `LOG-`, `NTF-`, `U`) as either real DB-generated IDs or explicit string fields, per the migration decision below.

## Architectural Patterns

### Pattern 1: Store-as-seam (keep `store.js`'s public API, replace its internals)

**What:** `store.js` keeps every existing exported method name (`getPermintaan`, `addKeputusan`, `cariAkun`, `tambahKota`, etc.) and the `subscribe`/`notify` pub-sub contract, but every method body changes from synchronous array mutation + `localStorage.setItem` to an `async` function that calls `src/api/client.js`, awaits the response, updates an in-memory cache, and then calls `notify()`.

**When to use:** This is the right choice for Switera specifically because ~12 page components and several shared components (`Layout.jsx`) call `store.X()` directly, with zero existing loading/error state anywhere. Changing the *call sites* in 12 files is a much bigger, riskier diff than changing the *implementation* of ~30 methods in one file.

**Trade-offs:**
- Pro: Minimizes the page-level diff — most pages only need to add `await`/`.then()` and a loading flag around calls they already make; component structure, JSX, and business logic stay intact.
- Pro: Preserves the existing pub-sub UX contract (`App.jsx`'s `store.subscribe(setSnapshot)`) almost unchanged — `notify()` still exists, it's just now triggered by network responses and by polling instead of by local mutation.
- Con: Every store method's *signature meaning* changes (was synchronous-returning-clone, now Promise-returning) even though the *name* doesn't — callers that did `const result = store.addPermintaan(x)` and used `result` synchronously will silently get a `Promise` object instead of data unless converted to `await`. This must be done at every call site that uses the return value, not just fire-and-forget calls.
- Con: `store.getState()` can no longer be "the live truth read synchronously" — it has to become "best-known cache, refreshed async," which subtly changes initial-render behavior (first render will be empty/loading instead of instantly correct) — this is the single biggest UX behavior change to budget for, since the codebase currently has **zero loading states anywhere**.

**Example (illustrative shape, not literal final code):**
```javascript
// src/store.js (after) — same method name, async internals
async addPermintaan(entry) {
  const saved = await apiClient.post("/api/permintaan", entry); // was: array push + localStorage write
  state.permintaan = [...state.permintaan, saved];
  notify();
  return saved; // callers must now `await store.addPermintaan(...)`
}
```

### Pattern 2: New API-client layer pages call directly (rejected for this migration, documented for completeness)

**What:** Introduce `src/api/*.js` modules (`permintaanApi.js`, `kotaApi.js`, ...) and rewrite every page to import and call these instead of `store`. `store.js` is deleted or reduced to just auth/session state.

**When to use:** Appropriate for a true rewrite or when the existing store abstraction is actively wrong for the new shape. Not appropriate here — `store.js`'s pub-sub contract is exactly the "instant reflect, no refresh" mechanism the project explicitly wants to preserve, and Switera's pages don't have an abstraction problem, they have a transport problem (sync local vs async remote).

**Trade-offs:**
- Pro: Cleaner long-term separation between "data fetching" and "global reactive cache" concerns; easier to add per-query caching libraries (React Query/SWR) later.
- Con (decisive for this project): Touches all ~12 pages' call sites directly, multiplies the surface area for regressions, and the project's constraint is explicitly "no rewrite of existing pages/components beyond what's needed to call the new API." This pattern requires far more than the minimum.
- **Recommendation: do not use this pattern for v2.0.** Pattern 1 (store-as-seam) satisfies the constraint; this one violates it.

### Pattern 3: Polling-driven cache invalidation via the existing `subscribe`/`notify` seam

**What:** Add a `setInterval`-based refetch (e.g. every 5-10 seconds) inside `store.js` itself — not in each page — that re-fetches each domain's collection from the API and calls `notify()` if the data changed. This reuses the *exact* existing subscription mechanism `App.jsx` already has (`store.subscribe((nextSnapshot) => setSnapshot(nextSnapshot))`), so no page-level subscription code changes at all.

**When to use:** This is the correct mechanism for Switera's "multiple users see synchronized data without manual refresh" requirement, given the project explicitly defers the polling-vs-WebSocket decision to roadmap/phase planning but flags it as needing resolution. Given the project's school-project scale (handful of concurrent users, not production traffic) and the explicit constraint against scaling infrastructure, **polling is the right default** — it requires zero new server infrastructure (no persistent connections, no `ws`/`socket.io` dependency), is trivial to implement and debug, and the "few seconds of staleness" trade-off is acceptable for this domain (distribution decisions/status updates aren't sub-second-latency-critical).

**Trade-offs:**
- Pro: No new backend dependency, no connection-management code, easy to reason about and debug (it's just a `setInterval` + `fetch`).
- Pro: Slots directly into the existing `notify()` → `listeners.forEach(...)` → `setSnapshot` chain in `App.jsx` — this is the literal "polling-driven cache-invalidation point" the existing pub-sub architecture already provides.
- Con: Each poll cycle re-fetches full collections even with no changes (bandwidth/DB-load inefficiency) — acceptable at this app's scale; would need `If-Modified-Since`/ETag or a real push mechanism if data volume grew significantly.
- Con: Up to one poll-interval's worth of staleness between a write by User A and User B seeing it — mitigate by also calling `notify()`/refetch immediately after *any* local mutation succeeds (so the mutating user always sees their own change instantly; only *other* users wait for the next poll tick).

**Example:**
```javascript
// src/store.js — new polling loop, reuses existing notify()/listeners
let pollHandle = null;
const startPolling = (intervalMs = 7000) => {
  if (pollHandle) return;
  pollHandle = setInterval(async () => {
    const fresh = await apiClient.get("/api/permintaan"); // + other domains
    if (JSON.stringify(fresh) !== JSON.stringify(state.permintaan)) {
      state.permintaan = fresh;
      notify(); // same listeners App.jsx already subscribes to
    }
  }, intervalMs);
};
```

## Data Flow

### Request Flow (e.g. submitting a new permintaan)

```
InputData.jsx form submit
    ↓ (same call site as today: store.addPermintaan(entry), now awaited)
store.js addPermintaan() → apiClient.post("/api/permintaan", entry)
    ↓ fetch with Authorization: Bearer <JWT>
Express routes/permintaan.routes.js → middleware/authenticate → middleware/authorize("Admin","Manajer Distribusi")
    ↓
controllers/permintaan.controller.js → services/permintaan.service.js
    ↓ (duplicate-date-per-city check ported from store.js's hasPermintaanDuplikat)
Prisma: prisma.permintaan.create({ data: {...} })
    ↓
PostgreSQL INSERT
    ↑ row returned
services → controller → res.json(savedRow)
    ↑
store.js receives response → updates in-memory cache → notify()
    ↑
App.jsx's subscription → setSnapshot → React re-render (now requires a brief loading state between submit and response, where today it was instant)
```

### State Management

```
PostgreSQL (durable truth, shared across all clients)
    ↓ polled / fetched
Express API (stateless, JWT-authenticated)
    ↓ fetch (async)
store.js in-memory cache (per-browser-tab, now a CACHE not the truth)
    ↓ (subscribe) — UNCHANGED MECHANISM
App.jsx snapshot state ←→ Page components (call store.X(), now await it)
```

### Key Data Flows

1. **Auth flow (replaces `cariAkun`/`setUserAktif`):** `Login.jsx` calls `store.cariAkun(username, password, role)` today, synchronously, against the in-memory `daftarAkun` array. After migration this becomes `await store.cariAkun(...)`, which internally `POST /api/auth/login`, the server verifies bcrypt hash + role, signs a JWT, returns `{ user, token }`; `store.js` stores the token (memory + optionally `localStorage` for refresh-on-reload) and sets `state.userAktif`. The plaintext-password risk flagged in `CONCERNS.md` is fully closed by this change — passwords never leave the server in plaintext after registration.
2. **Authorization enforcement moves server-side:** Today, `App.jsx`'s `allowedPages` check and `navigation.js`'s `menuByRole` are *cosmetic only* — nothing stops a console call to `store.hapusKota(...)` regardless of role. After migration, every mutating route is wrapped in `authorize("Admin")` (or whichever roles the action requires), so the server independently re-derives and enforces the same role rules the UI already encodes in `navigation.js` — the UI-only check becomes a defense-in-depth nicety, not the only line of defense.
3. **Multi-user sync flow:** User A (Manajer Distribusi) approves a distribution decision → write hits PostgreSQL → User B (Tim Logistik), polling every ~7s, picks up the new `keputusan` row on their next poll tick and sees it in `StatusDistribusi.jsx` without refreshing — replacing the current single-browser-only `localStorage` mirroring with genuine cross-client sync.
4. **Activity log / notifications (kept as a domain feature, now server-authored):** `recordActivity`/`pushNotifikasi` logic in today's `store.js` moves into backend `services/*.js` (e.g. the service that handles `addKeputusan` is also responsible for writing the activity-log row and notification row in the same transaction), since these are sequenced, audit-relevant side effects that must happen atomically with the mutation, not be re-derived per-client.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (school project, handful of concurrent users) | Single Express process, single PostgreSQL instance, 5-10s polling interval, no caching layer — exactly matches the project's explicit "no horizontal scaling/caching/microservices" constraint |
| If usage grew to dozens of concurrent users | Tune polling interval per domain (faster for `keputusan`/`status`, slower for `riwayatKeputusan`); add basic response caching headers; this is the first realistic adjustment, not a re-architecture |
| If usage grew to hundreds+ concurrent users | This is where WebSockets/SSE would start paying for their complexity (push instead of poll); out of scope for this milestone per `PROJECT.md` constraints |

### Scaling Priorities

1. **First bottleneck (won't actually be hit at this project's scale, but worth naming):** Full-collection refetch on every poll tick — today's `store.js` already does full-state `localStorage` writes on every mutation (flagged in `CONCERNS.md`), and naive polling would carry the same "refetch everything" habit forward. Fix path if ever needed: per-domain polling intervals instead of one global poll, or `updatedAt` cursor-based incremental fetch.
2. **Second bottleneck (also unlikely at this scale):** Prisma's deep-clone-equivalent (full object serialization) on every request/response — not a concern until row counts are in the thousands; no action needed now.

## Anti-Patterns

### Anti-Pattern 1: Rewriting all 12 pages to call a new API client directly, in one pass

**What people do:** Treat "add a backend" as license to also restructure the frontend's data-access pattern from scratch (introduce React Query, delete `store.js`, rewrite every page's data fetching).
**Why it's wrong:** Multiplies the diff surface exactly where the project's own constraint says not to ("no rewrite of existing pages/components beyond what's needed to call the new API") and discards a perfectly serviceable reactive pub-sub mechanism (`subscribe`/`notify`) that already gives the "instant reflect, no refresh" UX the project wants to preserve.
**Do this instead:** Keep `store.js` as the seam (Pattern 1 above); change its internals, not its public surface or its callers' structure.

### Anti-Pattern 2: Trusting client-side role checks as the authorization boundary

**What people do:** Assume that because `navigation.js`'s `menuByRole` already encodes "which role can see which page," the backend just needs to mirror the same UI logic loosely, or skip server-side checks on actions that "the UI already prevents."
**Why it's wrong:** This is precisely the gap `CONCERNS.md` flags today — UI-only gating does not stop a direct call. Once there's a real shared database with real other users' data in it, an unauthorized write (e.g. Tim Logistik deleting a city) is a real data-integrity incident, not a cosmetic glitch.
**Do this instead:** Every mutating Express route gets an explicit `authorize(...roles)` middleware check based on the JWT's role claim, independent of and not merely "trusting" the frontend's menu visibility. Treat `navigation.js`'s role map as the *source of truth to port*, not as something the backend can skip re-implementing.

### Anti-Pattern 3: Treating "swap localStorage for fetch" as a drop-in, no-UI-impact change

**What people do:** Assume that because `store.js`'s method names don't change, the migration is "just" a backend addition with no frontend UX impact.
**Why it's wrong:** Every single store call site today assumes synchronous, always-succeeds, instant data. There are currently **zero loading states and zero error-handling UI** anywhere in the 12 pages. The moment any `store.X()` call becomes a network request, every one of those call sites can now be slow (show stale/blank UI) or fail (network error, 401 expired token, 403 wrong role, 409 duplicate) with no existing UI pattern to surface it.
**Do this instead:** Budget explicit phase work for adding loading states (the codebase already has a `Skeleton.jsx` component and `useMountSkeleton.js` hook — reuse these, don't invent new ones) and error surfaces (the existing `Toast.jsx`/`useToast` mechanism is the natural place to surface fetch failures, since it's already used for notifications). This is not a side effect to discover during implementation — it is a first-class scope item for the migration phases.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Prisma Client, connection string in `server/.env` (`DATABASE_URL`) | New — local Postgres instance for dev (Docker or native install); no managed-cloud requirement given school-project/local-run scope |
| JWT (`jsonwebtoken` package) | Access token (short-lived, 5-15 min per researched convention) signed at login, role claim embedded in payload | New — `JWT_SECRET` in `server/.env`; decide refresh-token strategy (refresh token + rotation, or simpler: just re-login on expiry) during phase planning — full refresh-token infra may be more than this school project needs |
| bcrypt (`bcrypt` or `bcryptjs` package) | Hash on registration, compare on login | New — replaces `store.js`'s plaintext `password === password` check in `cariAkun`; closes the exact risk flagged in `CONCERNS.md` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React pages ↔ `store.js` | Direct function calls, now `async`/`await` instead of synchronous — **call sites stay structurally the same, just add `await`** | The actual migration seam; ~12 page files need `await`/loading-state additions, not logic rewrites |
| `store.js` ↔ `src/api/client.js` | New thin internal boundary inside the frontend — `client.js` owns `fetch`, base URL, JWT header attachion, response/error parsing; `store.js` owns domain methods and the pub-sub cache | Keeps HTTP plumbing out of `store.js`'s 30 domain methods; makes the transport layer swappable/testable independent of business-method names |
| `App.jsx`'s `subscribe`/`notify` ↔ Page components | **Unchanged** — `App.jsx`'s existing `useEffect(() => store.subscribe(setSnapshot), [])` keeps working verbatim; it doesn't care whether `notify()` was triggered by a local mutation (today) or an async fetch response / poll tick (after migration) | This is the single biggest reason Pattern 1 (store-as-seam) is the right call — this exact mechanism is reused, not replaced |
| Express routes ↔ services ↔ Prisma | New backend-internal boundary; routes/controllers know nothing about SQL, services know nothing about HTTP | Standard layered Express pattern; this is also where `store.js`'s existing business rules (duplicate checks, cascade-rename on city rename, block-delete-if-referenced) get ported almost line-for-line from JS array methods to Prisma queries |
| `App.jsx`'s role-gating (`allowedPages`) ↔ backend `authorize` middleware | Both must independently encode the same Admin/Manajer Distribusi/Tim Logistik rules — **not the same code, but must not drift** | Recommend deriving both from one shared source of truth if feasible (e.g. a small shared `roles.js` config consumed by both `src/utils/navigation.js` and `server/src/middleware/authorize.js`), to avoid the UI and the API silently disagreeing on who can do what |

## Build Order (Recommended)

Given the constraint that frontend pages currently assume synchronous, always-instant store calls with zero loading/error states, the safest sequencing is:

1. **Backend skeleton + schema first, frontend untouched.** Stand up `server/` (Express app, Prisma schema modeling all 6 current store collections — Akun, Kota, Permintaan, Keputusan/RiwayatKeputusan, ActivityLog, Notifikasi — migrations, seed script porting `src/data/*.json`). Verify with Postman/curl only. Zero frontend risk during this phase.
2. **Auth endpoints + JWT/RBAC middleware.** Build `/api/auth/register`, `/api/auth/login`, `authenticate`/`authorize` middleware, ported password-hash logic. This unblocks every other route (everything else needs a valid token) and is the highest-risk/highest-value piece to get right early, since `PROJECT.md` calls out server-side auth as a named milestone goal.
3. **Domain CRUD routes, one collection at a time, mapped 1:1 to existing store methods.** Suggested order follows dependency direction already visible in `store.js`: Kota first (Permintaan and Keputusan both reference city names), then Permintaan, then Keputusan/RiwayatKeputusan, then ActivityLog/Notifikasi last (these are side-effect logs other services write to, not independently mutated by users).
4. **Frontend: introduce `src/api/client.js`, then convert `store.js` internals method-by-method, matching the same Kota → Permintaan → Keputusan → ActivityLog order.** Converting one collection's methods at a time (rather than all 30 methods in one commit) lets each page that touches that collection be tested in isolation before moving to the next.
5. **Per-page loading/error UI pass, scoped to whichever collection was just converted.** Add loading states (reuse `Skeleton.jsx`/`useMountSkeleton`) and error surfaces (reuse `Toast.jsx`) at each page's call sites as that page's underlying store methods go async — do not defer all UI polish to the end, since by then every page will have silently regressed (blank renders on slow network, silent failures on error).
6. **Polling/cache-invalidation loop last**, once all domains are confirmed working over plain request/response — add the `setInterval`-driven refetch + `notify()` (Pattern 3) as a final layer on top of an already-working async `store.js`, since debugging "is data wrong because of a polling bug, or because the underlying fetch is wrong" is much harder if both are introduced simultaneously.
7. **Cross-role manual UAT pass** (matches the project's existing Phase 5-style "full pass across every page, per role" practice) — specifically re-test the exact scenario `CONCERNS.md` flags as currently unguarded: attempt a disallowed action as a non-Admin role and confirm the *server* (not just the UI) rejects it.

## Sources

- [Incremental Migration: Evolving Without Breaking Production (Medium)](https://medium.com/@navidbarsalari/incremental-migration-evolving-without-breaking-production-edf679769918) — MEDIUM confidence, cross-checked against Strangler Fig pattern consensus across multiple results
- [Incremental migration approaches for legacy applications (CircleCI)](https://circleci.com/blog/incremental-migration-approaches-for-legacy-applications/) — MEDIUM confidence
- [JWT Authentication using Prisma and Express (Mihai Andrei)](https://mihai-andrei.com/blog/jwt-authentication-using-prisma-and-express/) — MEDIUM confidence
- [Step-by-Step Guide to Secure JWT Authentication with Refresh Tokens in Express.js, TypeScript, and Prisma (Medium)](https://medium.com/@gigi.shalamberidze2022/implementing-secure-authentication-authorization-in-express-js-with-jwt-typescript-and-prisma-087c90596889) — MEDIUM confidence
- [Node.js + Prisma + PostgreSQL: Access & Refresh Tokens (codevoweb)](https://codevoweb.com/node-prisma-postgresql-access-refresh-tokens/) — MEDIUM confidence
- [TypeScript, PostgreSQL, Prisma Backend — Authentication, Authorization (Prisma official blog)](https://www.prisma.io/blog/backend-prisma-typescript-orm-with-postgresql-auth-mngp1ps7kip4) — MEDIUM-HIGH confidence (vendor-official)
- [Prisma schema overview (Prisma official docs)](https://www.prisma.io/docs/orm/prisma-schema/overview) — HIGH confidence (official docs)
- [Models / relations (Prisma official docs)](https://www.prisma.io/docs/orm/prisma-schema/data-model/models) — HIGH confidence (official docs)
- [Seeding (Prisma official docs)](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding) — HIGH confidence (official docs)
- [Migration strategies (Prisma's Data Guide, official)](https://www.prisma.io/dataguide/types/relational/migration-strategies) — HIGH confidence (official docs); source of the expand-and-contract pattern recommendation
- [WebSockets vs Server-Sent Events vs Polling (DEV Community)](https://dev.to/crit3cal/websockets-vs-server-sent-events-vs-polling-a-full-stack-developers-guide-to-real-time-3312) — MEDIUM confidence
- [Don't Forget the User: Polling vs WebSockets in 2025 (Medium / Israeli Tech Radar)](https://medium.com/israeli-tech-radar/dont-forget-the-user-polling-vs-websockets-in-2025-cb99999db9be) — MEDIUM confidence
- [How to Structure Express.js Projects for Scale (oneuptime)](https://oneuptime.com/blog/post/2026-02-02-express-project-structure/view) — MEDIUM confidence
- [Best Way to Structure an Express.js App: Modular vs Layered Approach (Medium)](https://medium.com/@branimir.ilic93/express-js-best-practices-modular-vs-layered-approach-for-medium-and-large-appsintroduction-626e61cc908d) — MEDIUM confidence
- [Exploring Design Patterns for Express.js Projects: MVC, Modular, and More (DEV Community)](https://dev.to/ehtisamhaq/exploring-design-patterns-for-expressjs-projects-mvc-modular-and-more-37lf) — MEDIUM confidence
- Codebase facts (file/line references) — HIGH confidence, verified by direct reading: `C:\Users\acer\Switera\src\store.js`, `C:\Users\acer\Switera\src\App.jsx`, `C:\Users\acer\Switera\.planning\codebase\ARCHITECTURE.md`, `C:\Users\acer\Switera\.planning\codebase\CONCERNS.md`, `C:\Users\acer\Switera\.planning\codebase\STRUCTURE.md`, `C:\Users\acer\Switera\.planning\PROJECT.md`

---
*Architecture research for: Switera v2.0 backend migration (Node.js/Express/PostgreSQL/Prisma onto existing client-only React SPA)*
*Researched: 2026-06-24*
