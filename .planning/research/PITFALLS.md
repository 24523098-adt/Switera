# Pitfalls Research

**Domain:** Migrating a synchronous, single-user, localStorage-only React SPA to a Node.js + Express + PostgreSQL (Prisma) backend with JWT auth and genuine multi-user concurrency
**Researched:** 2026-06-24
**Confidence:** MEDIUM (cross-verified web search against well-established, multiply-corroborated industry patterns — TOCTOU/race conditions, optimistic vs. pessimistic locking, JWT authorization pitfalls, async-UI loading/error patterns. No project-specific case study exists for this exact app, so findings are general patterns applied to Switera's actual code, not verified against a live incident in this codebase.)

This file focuses exclusively on mistakes specific to **this migration's four axes** — sync→async, single-user→multi-user, UI-gating→real-authz, client-calc→server-calc — anchored to the actual code in `src/store.js`, `src/utils/distribusi.js`, and `src/pages/KeputusanDistribusi.jsx`. Generic Express/Postgres setup mistakes are out of scope.

## Critical Pitfalls

### Pitfall 1: The "check-then-act" decision flow ports directly to the server, race and all

**What goes wrong:**
`KeputusanDistribusi.jsx:54-64` (`saveKeputusan`) reads `snapshot.keputusan` from in-memory state, scans it in JS for an existing active decision for the target city, and only if none is found calls `store.addKeputusan(...)`. This is a textbook TOCTOU (time-of-check to time-of-use) pattern. In the current single-user app it's harmless — there is exactly one execution thread. The instant this becomes `GET /keputusan` (check) followed by `POST /keputusan` (act) from a browser, with two Manajer Distribusi users open at once, there is a window between the check and the act where a second request can pass the same check before the first one's write lands. Both managers click "approve" for the same city within the same network round-trip and **both succeed**, creating two simultaneous active decisions for the same city/stock — the exact business invariant the original code was trying to enforce.

**Why it happens:**
The check-then-act shape is invisible as a bug in synchronous, single-threaded code — it only becomes a race once "check" and "act" are two separate network round-trips with real latency between them, with other clients able to act in that gap. Teams porting business logic literally translate the JS `if (existingDecision) return; else mutate()` into a JS-on-the-server `if/then` without re-deriving it as an atomic database operation, because nothing in the original code signals it was ever a multi-actor scenario.

**How to avoid:**
Push the invariant into the database, don't re-implement it as an application-level check in the new Express handler. Concretely for this exact case: add a partial unique constraint or unique index in Prisma (e.g. unique on `(kota_tujuan)` where `status != 'selesai'`, or model "active decision per city" as a 1:1 relation) so the second concurrent INSERT fails at the DB layer instead of relying on a prior SELECT. Catch the resulting unique-constraint violation (Prisma error code `P2002`) in the route handler and translate it into the same user-facing "Kota X sudah memiliki keputusan distribusi aktif" toast the frontend already shows — the UX doesn't change, only the moment the truth is checked. Where a constraint can't express the invariant, wrap the read+write in a single Prisma interactive transaction (`prisma.$transaction(async (tx) => {...})`) using `SELECT ... FOR UPDATE`-equivalent locking, not two independent calls.

**Warning signs:**
A code reviewer should flag any new Express route handler that does `const existing = await prisma.x.findFirst(...); if (existing) return error; await prisma.x.create(...)` as two separate calls — that's the same shape as the bug. A tester can reproduce it directly: open the same "approve distribution" action in two browser tabs logged in as two different Manajer Distribusi accounts, click both within ~1 second of each other, and check whether the database ends up with two active decisions for the same city.

**Phase to address:**
The phase that implements the `keputusan` (decision) write endpoints — this must be designed with the constraint/transaction from the start, not retrofitted. Flag this as the single highest-priority concurrent-write endpoint in the whole migration, since it's also the one with real business consequences (double-allocating finite TBS stock).

---

### Pitfall 2: Zero loading/error UI today means the frontend silently assumes every call is instant and succeeds

**What goes wrong:**
Every one of the ~12 page components calls `store.x()` synchronously and re-renders off the pub/sub `subscribe()` callback with no concept of "pending" or "failed." When these calls become `fetch()`/`axios` calls to Express, the naive port keeps the same shape — call the function, assume it resolves, re-render. Three concrete consequences in this codebase: (1) `KeputusanDistribusi.jsx`'s "Setujui" button has no disabled-while-pending state, so a slow network lets a user click it multiple times, firing duplicate requests; (2) there is no error path anywhere, so a failed request (network blip, validation rejection, 401 from an expired JWT) has nowhere to go except an unhandled promise rejection or a silently stale UI; (3) the optimistic "instant reflect" UX explicitly required by PROJECT.md ("every action persists and reflects instantly") cannot be preserved by literally doing nothing while a network request is in flight — it must be *engineered* (optimistic update + rollback-on-error), not assumed for free the way synchronous localStorage gave it for free.

**Why it happens:**
The store's pub/sub model trained both the codebase and the original developer's mental model to treat every mutation as synchronous-and-infallible, because for a year of development it always was. There is no muscle memory in this codebase for "what if this fails" because nothing has ever been able to fail.

**How to avoid:**
Before writing API-calling code, decide and document one consistent pattern for "in-flight" and "failed" states across all ~12 pages — do not let each page invent its own. Concretely: wrap every mutating call in a small helper (or adopt a data-fetching library) that (a) disables the triggering button immediately, (b) optimistically applies the change to local state for instant reflect, (c) on server confirmation reconciles silently, (d) on server rejection rolls back the optimistic change and surfaces the existing `showToast({type: "error", ...})` mechanism that already exists in the codebase for this exact purpose. Reuse `Toast.jsx`'s existing error-toast capability rather than inventing a new error-display surface. For reads (page-load data fetching), every page needs a loading skeleton/spinner before first paint — there is no existing component for this, so build one shared `LoadingState` component analogous to the existing shared `EmptyState` component before any page is migrated, so all 12 pages stay visually consistent.

**Warning signs:**
A reviewer should be able to grep for every new `fetch`/`axios` call and verify each one has a corresponding loading flag and a `catch`/`onError` path — any mutating call without both is a regression risk. A tester should throttle the network (Chrome DevTools "Slow 3G") and click every primary action button twice in a row on every page; if any button fires two requests or the UI looks frozen with no feedback, this pitfall is live. Killing the backend process mid-session and clicking any action button should produce a visible error toast, not a silent no-op or a console-only error.

**Phase to address:**
This must be solved once, early, as its own cross-cutting concern — likely the first phase that wires any page to the new API at all (the "frontend API client" phase) — not discovered piecemeal page-by-page. If even one page ships with the old assume-instant-success pattern, the inconsistency will be visible to a reviewer immediately (PROJECT.md's "nothing looks unfinished or inconsistent" core value is directly at risk here).

---

### Pitfall 3: UI-only role gating gets "replaced" by a JWT that frontend code still trusts to decide what's allowed

**What goes wrong:**
Today, `App.jsx`'s `allowedPages` check and `navigation.js`'s `menuByRole` are explicitly documented (CONCERNS.md, ARCHITECTURE.md) as cosmetic — they hide menu items but nothing stops a Tim Logistik user from calling `store.addKeputusan(...)` directly from the browser console, because there is no server to refuse it. The natural-seeming "fix" is to put the role inside the JWT and keep the *exact same* `if (role === "Admin")` checks in React, now reading `jwt.role` instead of `state.roleAktif`. This is not a fix — it relocates the cosmetic check, it doesn't add a real one. The actual mistake is shipping Express route handlers that trust the JWT's role claim for *display* purposes (fine) while never independently re-checking `req.user.role` server-side before executing privileged mutations like `DELETE /kota/:id` or `PUT /kota/:id/stok` (not fine) — i.e., decoding the JWT to know who's asking, but forgetting to add the authorization check that decides whether they're allowed to do what they're asking.

**Why it happens:**
Because there has never been a server in this app, there is no existing mental model anywhere in the codebase for "the same role check needs to exist twice, once for UX and once for security, and they can drift." Teams that have only ever built UI-gating reach for "add the role to the token" as a complete solution because, before now, the UI check was the *only* check that existed.

**How to avoid:**
Treat every Express route as if the frontend role-check doesn't exist. Add Express middleware (e.g. `requireRole("Admin")`) that runs on the server for every route that maps to a privileged mutation in the current store (city/stock management = Admin-only; decision approval = Manajer Distribusi-only; status updates = Tim Logistik-only — mirror `navigation.js`'s existing role→page map as the source of truth for role→endpoint mapping, don't redesign it). Keep the JWT payload minimal — just user id and role, not a sprawling permissions list — and do the actual allow/deny decision in server middleware against that role, not by trusting a client-supplied permissions blob. Since this is a small, fixed set of 3 roles and a small number of mutating endpoints (not a generic permissions system), a simple per-route role allowlist is sufficient — resist the urge to build a generic RBAC/claims engine for a 3-role school project.

**Warning signs:**
A reviewer should be suspicious of any Express route handler that has zero role/auth check and only relies on "the frontend won't show this button to the wrong role." The concrete test: get a valid JWT for a Tim Logistik account (login normally), then use `curl`/Postman to call an Admin-only endpoint (e.g. delete a city) directly with that token, bypassing the UI entirely. If it succeeds, authorization is still UI-only in spirit even though a "real" backend now exists.

**Phase to address:**
The auth phase must ship server-side role middleware applied to every mutating route in the same commit/PR that adds JWT issuance — not as a "harden later" follow-up. Verification for this phase should explicitly include the curl-bypass test above for at least one endpoint per role, not just "login works."

---

### Pitfall 4: The ranking/recommendation engine moves to the server in name but keeps reading client-cached data

**What goes wrong:**
`computeRekomendasiDistribusi` (`src/utils/distribusi.js:105-142`) is currently pure and synchronous: it takes `permintaan`, `daftarKota`, `stokTbs` as plain arguments and computes a recommendation in one pass, called directly from `KeputusanDistribusi.jsx`'s `useMemo` against the live `snapshot` from the store's pub/sub. Once `permintaan`/`daftarKota`/`stokTbs` live in Postgres and are shared across concurrent users, this function's *output is only as correct as the inputs it's given* — and the natural incremental-migration mistake is to move the calculation itself to an Express endpoint (`GET /rekomendasi`) while the frontend keeps calling it with `daftarKota`/`stokTbs` it already has cached client-side from an earlier fetch (e.g. to avoid "another loading spinner"). If another user just changed `stokTbs` (Admin updates stock) or another manager just approved a decision against the same city (consuming capacity), a stale client-cached `stokTbs`/`daftarKota` produces a recommendation that's already wrong the moment it's shown — and worse, if the *allocation decision itself* (not just the recommendation display) is computed client-side from stale inputs and then POSTed as the decision payload, the server has no way to tell the difference between "fresh calculation" and "calculation from 10 minutes ago," and will happily persist a decision based on stock that's already been spent.

**Why it happens:**
This is the most subtle pitfall in the set because it doesn't look like a regression — the recommendation algorithm itself is unchanged and still "works" in the sense of returning a plausible-looking answer; it just silently used data that's no longer true. Partial migrations are especially prone to this because the team correctly identifies "the calculation moves server-side" but doesn't equally enforce "and so does the read of its inputs, atomically, at decision time" — these are two different migrations bundled inside what looks like one function move.

**How to avoid:**
Move the entire calculation **and** its input-reads server-side as one unit: the recommendation endpoint should query `permintaan`/`daftarKota`/`stokTbs` fresh from Postgres inside the same request that computes the recommendation, never accept these as client-supplied parameters. More importantly, the actual `POST /keputusan` (save decision) endpoint must **not** trust a client-submitted `alokasi`/`volume_tbs` number computed minutes earlier in the browser — it must re-derive or at minimum re-validate the allocation against current server-side stock inside the same transaction that writes the decision (same atomicity requirement as Pitfall 1: read current `stokTbs`, validate the requested allocation against it, and write the decision, all inside one transaction/lock). Treat any client-side numeric input that represents "how much stock to allocate" as a hint to revalidate, never as a fact to persist as-is.

**Warning signs:**
A reviewer should check whether the "save decision" endpoint takes the allocation amount as a trusted request body field versus recomputing/validating it server-side against current stock. A concrete test: open the recommendation view, let the page sit idle while (in another session) an Admin reduces `stokTbs` to near zero or another manager allocates most of the remaining stock to a different city, then submit the original (now-stale) recommendation from the first session — the server should reject or clamp the allocation, not blindly persist the original number.

**Phase to address:**
The phase that moves `distribusi.js`'s recommendation engine server-side. This phase's done-criteria must explicitly include "decision-save endpoint revalidates stock server-side at write time," not just "recommendation is computed on the server" — those are two different guarantees and it's easy to ship only the first.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Keep `distribusi.js`'s pure functions unchanged, just call them from an Express route instead of moving the algorithm's logic into SQL/Prisma queries | Near-zero rewrite risk to a working, business-critical algorithm | Endpoint still does "fetch everything, compute in JS" rather than letting Postgres do aggregation — fine at this data scale (a handful of cities/requests for a school project) but would not scale | Acceptable indefinitely at this project's scale; revisit only if `permintaan`/`keputusan` row counts grow by orders of magnitude |
| Skip a generic permissions/RBAC engine, hardcode 3 roles in route middleware | Fast to implement, easy to audit (one allowlist file) | Doesn't generalize if a 4th role or per-resource permission is ever needed | Acceptable — explicitly fine given PROJECT.md scope says "no new roles" |
| Use polling instead of WebSockets for "instant reflect" sync across clients | Much simpler to implement and debug than a WS layer; fits a small number of concurrent users | Slightly delayed cross-client updates (poll interval lag); more requests than necessary | Acceptable for this project's expected concurrency (a handful of simultaneous users in a school demo) — explicitly called out as an open decision in PROJECT.md |
| Catch unique-constraint violations (P2002) in route handlers instead of pre-checking everywhere | Removes the TOCTOU window correctly (see Pitfall 1) | Every mutating handler needs its own try/catch translating DB errors into domain-meaningful toasts — more boilerplate per route | Always acceptable — this is the *correct* pattern, not a shortcut to later regret |
| Leave JWTs long-lived with no refresh-token rotation for a school project | Simpler auth flow, fewer moving parts | Standard "stale token" problem — a revoked/changed role keeps working until expiry | Acceptable for a school project demo with trusted test accounts and short session lifetimes in practice; not acceptable if this were ever exposed publicly |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|------------------|-------------------|
| Prisma + Postgres concurrent writes | Treating two sequential Prisma calls (`findFirst` then `create`) as atomic just because they're "right next to each other" in the same async function | Use `prisma.$transaction(async (tx) => {...})` (interactive transaction) for read-then-write sequences that must be atomic, or rely on a DB unique constraint and catch `P2002` |
| JWT in `localStorage`/memory on the frontend | Porting the exact pattern that stored plaintext passwords in `localStorage` (`store.js`) to now store the JWT the same way without considering XSS exposure | Store the JWT in an httpOnly cookie if feasible, or at minimum keep it out of any code path that also handles untrusted user-generated content (CSV export, free-text fields) given the existing unresolved CSV-injection concern noted in CONCERNS.md |
| bcrypt password hashing replacing plaintext comparison | Migrating existing seed accounts (`admin`/`admin123` etc.) by hashing them at runtime on first login instead of a deliberate one-time migration script | Write an explicit seed/migration step that hashes all seed account passwords before the app ever compares against them; never compare a plaintext input against a plaintext-stored seed "just for now" |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Polling every client every N seconds for "instant reflect" sync | Backend load scales with (number of open clients) × (1/poll interval), not with actual data change rate | Make the poll interval configurable and conservative (e.g. 3-5s) for this project's scale; consider ETag/If-None-Match on poll responses so unchanged data doesn't get re-serialized/re-rendered | Only relevant if concurrent client count grows far beyond a school-project demo — not a near-term concern per PROJECT.md scope |
| Re-fetching full `daftarKota`/`permintaan` lists on every page navigation, mirroring the old store's "return the whole state" habit | Repeated full-table round trips where only one row changed | Fetch what each page actually needs; don't port the store's "always return full deep-cloned state" habit into "always return the full table" from the API | Noticeable once `permintaan`/`keputusan` row counts grow past a few hundred — unlikely to bite at school-project data volumes but easy to avoid from the start |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Authorization decision made by trusting a JWT claim alone without re-checking against the live `role` value tied to the user's account record | A role downgrade/account deactivation doesn't take effect until token expiry — user keeps privileged access | Keep JWT-asserted role short-lived (short expiry + refresh) or re-validate role against the DB for highly sensitive actions (e.g. city/stock deletion) rather than trusting the token claim alone |
| Embedding per-resource permission data in the JWT payload to avoid a DB round-trip | Token bloat, and permission changes require re-issuing tokens to take effect — same staleness problem, worse | Keep the JWT to identity + coarse role; do fine-grained checks server-side against current DB state |
| Reusing the exact plaintext-comparison mental model (`cariAkun`) for the new login endpoint "just to get it working first, hash later" | Real bcrypt migration gets deprioritized once login "works"; ships with plaintext comparison in a "real" backend | Implement bcrypt hashing in the very first version of the login/register endpoints — there is no working intermediate state where plaintext is acceptable once a real backend exists, unlike v1.0 where it was an explicitly accepted demo trade-off |
| No request-body validation library on the new Express endpoints (mirroring `store.js`'s historical lack of schema validation) | Express + Prisma will happily accept malformed payloads and either 500 or write bad data, since the old code's only validation was ad-hoc UI-side | Add basic schema validation (e.g. Zod) at the Express route boundary for every mutating endpoint — this is a new requirement, not present in the codebase today, and is easy to skip since "the old code never needed it either" |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Silent failure on network/auth errors (no error UI exists today) | User clicks "save" and nothing visibly happens; they assume it worked (old app trained them to expect this) and move on, while the action actually failed | Surface every failure via the existing `showToast({type: "error", ...})` mechanism — it already exists and is already used for warnings (see `KeputusanDistribusi.jsx`'s duplicate-decision warning toast) so extend it, don't invent a new pattern |
| No "syncing..." / "saved" affordance once writes are no longer instantaneous | Users double-click submit buttons because there's no feedback that the first click registered | Disable the action control immediately on click and re-enable on response (success or failure), consistent across all 12 pages |
| A second user's concurrent change appears to silently overwrite the first user's without explanation (lost update) | A manager who just acted sees their decision vanish/change with no indication why, eroding trust ("nothing looks unfinished or inconsistent" core value directly violated) | When an optimistic-locking conflict (409) occurs, show a specific toast ("Data ini baru saja diperbarui oleh pengguna lain — silakan muat ulang") rather than silently failing or silently overwriting |

## "Looks Done But Isn't" Checklist

- [ ] **Decision-approval endpoint:** Looks done when "approve" returns 200 and the UI updates — verify it's actually race-safe by firing two concurrent approve requests for the same city from two sessions and confirming only one succeeds (Pitfall 1).
- [ ] **Role-based endpoint protection:** Looks done when the UI correctly hides buttons per role — verify with a direct curl/Postman call using a lower-privileged role's valid JWT against a higher-privileged endpoint; it must be rejected server-side (Pitfall 3).
- [ ] **Loading/error states:** Looks done when the happy path renders correctly — verify by throttling network and killing the backend mid-action on every one of the 12 pages, not just the ones touched first (Pitfall 2).
- [ ] **Server-side recommendation engine:** Looks done when `GET /rekomendasi` returns a plausible number — verify the decision-save endpoint independently revalidates stock/allocation server-side rather than trusting a client-submitted number computed earlier (Pitfall 4).
- [ ] **Password security:** Looks done when login works against seeded accounts — verify the seed accounts were actually migrated through bcrypt hashing (inspect the DB column directly), not compared in plaintext "temporarily."
- [ ] **Multi-client sync ("instant reflect" parity with v1.0):** Looks done when a single browser tab reflects its own actions instantly (this still "works" trivially via optimistic UI) — verify a *second* browser/session sees the *first* session's change without a manual refresh, within the chosen poll/WS interval.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Race condition shipped in decision-approval endpoint (Pitfall 1) | MEDIUM | Add the missing unique constraint/transaction retroactively via a Prisma migration; write a cleanup script to resolve any already-duplicated active decisions in the DB (pick the earliest by timestamp, cancel the rest with an activity-log entry explaining why) |
| Authorization gap discovered (an endpoint trusts the JWT role without server-side re-check) (Pitfall 3) | LOW–MEDIUM | Add the missing middleware to the specific route; audit all other mutating routes for the same gap in the same pass rather than fixing one at a time |
| Stale client-cached inputs feeding the recommendation/decision flow (Pitfall 4) | MEDIUM | Change the decision-save endpoint to re-derive/validate allocation server-side; for any already-persisted decisions made against stale data, surface them for manual Admin review rather than silently leaving them |
| Missing loading/error states shipped across multiple pages (Pitfall 2) | LOW | Retrofit the shared `LoadingState`/error-toast pattern page by page — low cost because it's additive UI, not a data-model change |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|---------------|
| Check-then-act race on concurrent decision approval (Pitfall 1) | The phase implementing `keputusan` write endpoints (decision approve/cancel) | Two-session concurrent-approve test against the same city must result in exactly one active decision in the DB |
| No loading/error states anywhere (Pitfall 2) | The first phase wiring any page to the new REST API (frontend API-client phase) | Network-throttled + backend-killed manual pass across all 12 pages; every mutating action has visible pending + error feedback |
| UI-only role gating "moved" into JWT without server-side re-check (Pitfall 3) | The auth phase (JWT issuance + middleware), same phase/PR — not split | Direct API call with a lower-privileged token against every Admin/Manajer/Logistik-restricted endpoint must be rejected (401/403) |
| Recommendation engine moved server-side but decision-save still trusts stale client-computed allocation (Pitfall 4) | The phase moving `distribusi.js`'s recommendation logic server-side | Stale-then-submit test: change stock/allocate elsewhere mid-session, then submit an old recommendation; server must reject or reclamp, not persist blindly |
| Plaintext seed accounts compared/stored without bcrypt "temporarily" | The auth phase, specifically the account-seeding/migration step | Inspect DB directly to confirm password column contains bcrypt hashes, not plaintext, before any login endpoint is considered done |
| No request validation on new Express mutating endpoints | Each domain's CRUD-endpoint phase (kota, permintaan, keputusan, akun) | Submit malformed/missing-field payloads to each endpoint; must return a 4xx with a clear validation error, not a 500 or silent bad write |

## Sources

- [Time-of-check to time-of-use - Wikipedia](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use) — MEDIUM confidence, cross-verified concept definition
- [Transactions and batch queries (Reference) | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — MEDIUM confidence
- [Does prisma handle the concurrency and race conditions automatically?](https://www.softpost.org/prisma/does-prisma-handle-the-concurrency-and-race-conditions-automatically) — MEDIUM confidence
- [Concurrent transactions strange behaviour · prisma/prisma · Discussion #23200](https://github.com/prisma/prisma/discussions/23200) — MEDIUM confidence
- [Optimistic Locking in a REST API | Kevin Sookocheff](https://sookocheff.com/post/api/optimistic-locking-in-a-rest-api/) — MEDIUM confidence
- [API Concurrency Control Strategies | Medium](https://medium.com/swlh/api-concurrency-control-strategies-cd546c2cdc16) — MEDIUM confidence
- [Optimistic Locking vs Pessimistic Locking: Managing Concurrent Access | Medium](https://medium.com/@abhirup.acharya009/managing-concurrent-access-optimistic-locking-vs-pessimistic-locking-0f6a64294db7) — MEDIUM confidence
- [Preventing Double Booking in Databases with Two-Phase Locking | Medium](https://medium.com/@oyebisijemil_41110/preventing-double-booking-in-databases-with-two-phase-locking-9a4538650496) — MEDIUM confidence
- [Handling the Double-Booking Problem in Databases](https://adamdjellouli.com/articles/databases_notes/07_concurrency_control/04_double_booking_problem) — MEDIUM confidence
- [How to Use JWTs for Authorization: Best Practices and Common Mistakes | Permit.io](https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes) — MEDIUM confidence
- [Best Practices for Handling API Errors and Loading States in React](https://www.c-sharpcorner.com/article/best-practices-for-handling-api-errors-and-loading-states-in-react/) — MEDIUM confidence
- [Handling API Errors & Loading States in React (Clean UX Approach) - DEV Community](https://dev.to/addwebsolutionpvtltd/handling-api-errors-loading-states-in-react-clean-ux-approach-54o7) — MEDIUM confidence
- [How Senior React Developers Handle Loading States & Error Handling | Medium](https://medium.com/@sainudheenp/how-senior-react-developers-handle-loading-states-error-handling-a-complete-guide-ffe9726ad00a) — MEDIUM confidence
- Direct codebase inspection: `src/store.js`, `src/utils/distribusi.js`, `src/pages/KeputusanDistribusi.jsx`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md` — HIGH confidence (primary source, this repository)

---
*Pitfalls research for: Switera v2.0 backend & multi-user migration*
*Researched: 2026-06-24*
