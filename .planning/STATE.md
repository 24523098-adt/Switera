---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Backend & Multi-User Migration
status: verifying
stopped_at: context exhaustion at 87% (2026-07-03)
last_updated: "2026-07-03T16:41:43.417Z"
last_activity: 2026-07-10
last_activity_desc: "Completed quick task 260710-rmc: Peramalan Permintaan per Kota di AnalisisRanking (forecast.js + Sparkline) — celah MIS terakhir ditutup"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 18
  completed_plans: 18
  percent: 100
current_phase: 10
current_phase_name: Multi-Client Sync & Cross-Role UAT
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-24)

**Core value:** The app must feel complete and trustworthy end-to-end for every role — every page works, every action persists and reflects instantly, and nothing looks unfinished or inconsistent.
**Current focus:** **MILESTONE v2.0 (Backend & Multi-User Migration) IS COMPLETE.** All 10 phases (6 through 10, plus the pre-existing v1.0 phases 1-5) and all 18 plans are finished and verified. No further phases are planned within this milestone. Next action is a milestone close-out (e.g. `/gsd-complete-milestone`) and/or the recommended manual two-browser-tab check noted below — not further plan execution.

## Current Position

**v2.0 MILESTONE COMPLETE.** Phase: 10 of 10 (Multi-Client Sync & Cross-Role UAT) — FINAL phase, FINAL plan.
Plan: Not started
Status: **10-02-PLAN.md COMPLETE — v2.0 MILESTONE COMPLETE.** Built three multi-client verification scripts under `server/src/sync/` proving SYNC-01's success criteria hold with real concurrent client sessions (two independent `store.js` instances via Vite `ssrLoadModule` cache-busted imports) polling against the live backend: (1) `multiClientSync.verify.mjs` proves a mutation by one client session is observed by a second polling client session purely through its own real poll tick within one 4000ms interval, and that `stopPolling()` halts further sync; (2) `multiClientRbac.verify.mjs` re-proves the Phase 7 `POST /keputusan` 403 RBAC denial for Tim Logistik holds with BOTH sessions actively polling (Success Criterion 3), with an Admin positive control; (3) `multiClientRace.verify.mjs` re-proves the Phase 8 LOGIC-02 exactly-one-winner optimistic-lock guarantee through two REAL logged-in client sessions under active polling (Success Criterion 4), confirmed stable across 3 separate runs. All three scripts are self-cleaning/idempotent (re-run 2-3 times each with identical PASS output, zero orphaned rows). Two Rule-1 auto-fixes applied (a plan role/RBAC mismatch in Task 1, and a token cross-contamination hazard in the two-client bootstrap, both found and fixed before any script was committed — see 10-02-SUMMARY.md Deviations). Plan metadata commit skipped per the Phase 6-10 `commit_docs: false` standing constraint (SUMMARY.md/STATE.md written to disk only).
Last activity: 2026-07-10 — Completed quick task 260710-rmc: Peramalan Permintaan per Kota di AnalisisRanking (forecast.js + Sparkline) — celah MIS terakhir ditutup

Progress: [██████████] 100% (ALL 10 milestone phases complete, all 18 plans done — v2.0 MILESTONE COMPLETE; see Performance Metrics for plan-level detail)

## Performance Metrics

**Velocity:**

- Total plans completed: 32
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | - | - |
| 2 | 1 | - | - |
| 3 | 2 | - | - |
| 4 | 2 | - | - |
| 5 | 1 | - | - |
| 6 | 3 | - | - |
| 7 | 2 | - | - |
| 8 | 6 | - | - |
| 9 | 5 | - | - |
| 10 | 2 | - | - |

**Recent Trend:**

- Last 5 plans: 09-01 (35min), 09-02 (25min), 09-03 (30min), 09-04 (40min), 09-05 (50min)
- Trend: -

**Plan Execution Log:**

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 07 | 01 | 15min | 2 tasks | 6 files |
| 07 | 02 | 2min | 2 tasks | 4 files |
| 08 | 01 | 22min | 3 tasks | 7 files |
| 08 | 02 | 9min | 2 tasks | 7 files |
| 08 | 03 | 35min | 2 tasks | 5 files |
| 09 | 01 | 35min | 3 tasks | 4 files |
| 08 | 04 | 48min | 2 tasks (+1 fix) | 6 files |
| 08 | 05 | 5min | 2 tasks | 5 files |

*Updated after each plan completion*
| Phase 08 P06 | 35min | 2 tasks tasks | 17 files files |
| Phase 09 P02 | 25min | 2 tasks | 2 files |
| Phase 09 P03 | 30min | 3 tasks | 3 files |
| Phase 09 P04 | 40min | 3 tasks tasks | 4 files files |
| Phase 09 P05 | 50min | 3 tasks | 8 files |
| Phase 10 P01 | 6min | 2 tasks | 2 files |
| Phase 10 P02 | 32min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Full decision log for v1.0 is in `.planning/PROJECT.md` Key Decisions table, `.planning/RETROSPECTIVE.md`, and `.planning/milestones/v1.0-ROADMAP.md`.

- Phase 6-10 roadmap: 5-phase structure adopted as-recommended from `.planning/research/SUMMARY.md` (Backend Skeleton → Auth → Domain CRUD → Frontend Integration → Multi-Client Sync), backend-before-frontend sequencing to keep frontend risk at zero until the API is proven via curl/Postman.
- Stack: Express 5.x + Prisma 6.x (pinned, not 7.x) + PostgreSQL + jsonwebtoken + bcryptjs — see PROJECT.md Key Decisions.
- 06-01: Kota keeps its existing natural key (`nama` as `@id`, no surrogate integer ID) so store.js's cascade-rename/block-delete logic for cities maps 1:1 onto DB-level `ON UPDATE CASCADE` / `ON DELETE RESTRICT` FK behavior.
- 06-01: Keputusan/Notifikasi status/tipe fields kept as plain `String` (not Prisma enum) because store.js writes values outside the documented set (e.g. `removeKeputusan` writes `"dibatalkan"`); enum-level enforcement deferred to Phase 8's Zod layer.
- 06-01: Declined `npm audit fix --force` for 3 high-severity transitive vulnerabilities in Prisma's `effect` dependency — the fix would bump `prisma` to `6.19.3`, breaking the plan's exact-version-pin requirement (client+CLI must match at `6.19.2`). Accepted per threat model T-06-SC.
- [Phase ?]: 06-02: Inlined akunSeed/kotaSeed as constants in seed.js (matching their inline-array form in src/store.js) rather than creating new JSON files for them
- [Phase ?]: 06-02: Notifikasi.waktu and ActivityLog.waktu converted from JSON ISO-8601 strings to Date objects at seed-write time, matching the Plan 01 schema's DateTime typing without altering source JSON
- [Phase ?]: 06-02: Left legacy stokTbsSeed=150 unmodeled — out of scope for DATA-01/02/03 per plan instruction, deferred to Phase 8 if still needed
- [Phase 06-03]: Kota service layer (cascade-rename + block-delete) ported from src/store.js to live Prisma/PostgreSQL queries, with reference-count checks run before any write so errors stay clean Indonesian messages instead of raw Postgres FK-violation errors
- [Phase 06-03]: server/src/db/prismaClient.js established as the single PrismaClient instantiation point for the entire backend; all future Phase 7/8 services must import this shared instance
- [Phase 07-01]: Fixed plan's non-cross-platform run-directly check in server/src/index.js (file://+process.argv[1] template-string comparison) to use pathToFileURL(process.argv[1]).href, since process.argv[1] uses backslashes on Windows while import.meta.url always uses forward slashes
- [Phase 07-01]: Created server/src/routes/roleOptions.js as a server-side copy of src/utils/navigation.js's roleOptions rather than importing across the frontend/backend project boundary
- [Phase 07-01]: Generated a real random JWT_SECRET (48 random bytes, base64) into server/.env per plan's user_setup instruction, replacing the placeholder dev value; .env remains gitignored, not committed
- [Phase 07-02]: rbac.verify.mjs uses app.listen(0) ephemeral port + built-in fetch instead of fixed PORT — Avoids colliding with a developer's running dev server and keeps the script idempotent/re-runnable, matching akunService.verify.mjs's established pattern
- [Phase 07-02]: protectedRoutes.js is intentionally throwaway, not permanent API surface — Phase 8 replaces it with real domain routes that reuse the identical requireAuth + requireRole(...) middleware composition
- [Phase 08-01]: Stok modeled as a fixed-id singleton row (`id String @id @default("singleton")`, `stokTbs Int`) — closes the Phase 6 "stokTbs left unmodeled" gap; stokService.getStokTbs/setStokTbs mirrors src/store.js's exact coercion (`Number(value) || 0`) and defensive-0 fallback
- [Phase 08-01]: errorHandler prefers `err.statusCode` (new convention for Wave 2/3 services: `Object.assign(new Error(msg), { statusCode: 409 })`) over Indonesian message-matching, which is kept only as a fallback for the three pre-existing Phase 6/7 error strings
- [Phase 08-01]: CORS uses a static allow-listed origin string (`http://localhost:5173`, `CORS_ORIGIN` env override) rather than `origin: true` reflective, per threat model T-08-CORS
- [Phase 08-01]: Fixed a latent bug in server/src/index.js's run-directly check — `pathToFileURL(process.argv[1])` throws `ERR_INVALID_ARG_TYPE` when `process.argv[1]` is undefined (e.g. `node -e "import(...)"` verify-script invocations); guarded with `process.argv[1] &&` before the comparison
- [Phase 08-02]: kotaService.tambahKota added (was the one missing Phase 6 service fn); kota/stok routers establish the proven RBAC+Zod template (requireAuth/requireRole/validate(schema) composition) that 08-03 through 08-06 all copy
- [Phase 08 plan-check]: LOGIC-02's race-safety mechanism (08-04) is binding: optimistic locking via conditional `prisma.keputusan.updateMany({ where: { id, status: existingStatus } })`, NOT a unique constraint or a `$transaction` with row locking — rejected both alternatives as disproportionate/incorrect for this domain (see 08-04-PLAN.md objective for full rationale)
- [Phase 08 plan-check, revision round 1]: Fixed 3 blockers found by gsd-plan-checker before any execution: (1) LOGIC-03 originally omitted kota/stok activity-log generation despite 08-06's threat model claiming coverage — 08-06 was extended to wire catatAktivitas into kotaService.tambahKota/updateKota/hapusKota + stokService.setStokTbs, with 08-02 added to its depends_on; (2) 08-05's depends_on was missing 08-04 despite importing keputusanService; (3) 08-05 and 08-06 both modified server/src/index.js in the same wave (3) with no ordering — resolved by moving 08-06 to wave 4, depends_on 08-05. Re-checked, PASSED with zero new issues.
- [Phase 08-03]: permintaanService's addPermintaan/updatePermintaan/removePermintaan are pure CRUD only — store.js's notification + anomaly-notification + activity-log side effects (LOGIC-03) are explicitly deferred to 08-05, which will extend these same functions rather than duplicate the mapping/RBAC/validation layer
- [Phase 08-03]: toDb(entry) uses Object.prototype.hasOwnProperty checks (not a blind spread) so updatePermintaan's partial-merge only writes the snake_case keys actually present in the PUT body, leaving untouched fields alone
- [Phase 08-04]: LOGIC-02 closed in keputusanService.updateKeputusan via optimistic-lock conditional updateMany (binding mechanism confirmed correct per phase-planning rationale), but the naive guard had a same-target-status TOCTOU gap: a status-change request is now rejected with 409 whenever the read-time status does NOT differ from the target status, not just when the updateMany's WHERE clause fails to match — closes a ~8% intermittent-failure window only visible under live HTTP load (not reproducible at the pure service-call layer), see 08-04-SUMMARY.md Deviations for the full diagnosis
- [Phase 08-04]: updateKeputusan returns { updated, statusBerubah, existingStatus } specifically so 08-05's LOGIC-03 wrapper can decide whether to fire notification/activity-log side effects without re-reading the row or re-deriving the status-change decision
- [Phase 08-04]: PUT /keputusan/:id (status-change only) allow-lists Tim Logistik in addition to Admin/Manajer Distribusi, matching StatusDistribusi.jsx's workflow scope; POST/DELETE/restore remain Admin + Manajer Distribusi only
- [Phase 08-05]: distribusiService.js imports getDaftarKota/getPermintaan/getStokTbs/getKeputusan from the existing service layer; no direct Prisma calls, keeping all DB access behind the validated service functions
- [Phase 08-05]: Both GET /rekomendasi-distribusi and GET /kpi are requireAuth-only (no requireRole) — ranking/KPI data is read across all three roles' dashboards
- [Phase 08-05]: distribusiRouter mounted via app.use(distribusiRouter) with no prefix, since the router defines the full literal paths /rekomendasi-distribusi and /kpi, matching the ROADMAP success criterion's literal endpoint names
- [Phase ?]: [Phase 08-06] LOGIC-03 closed in full: catatAktivitas/tambahNotifikasi wired into addPermintaan/updatePermintaan/removePermintaan, addKeputusan/updateKeputusan/removeKeputusan/restoreKeputusan, tambahKota/updateKota/hapusKota, and setStokTbs -- every src/store.js mutation with a recordActivity call site has a server-side equivalent firing inside the same request, not a permintaan/keputusan-only subset
- [Phase ?]: [Phase 08-06] updateKeputusan's notification/activity-log side effects fire strictly after the optimistic-lock updateMany confirms count===1 and only when statusBerubah is true -- the 409-losing concurrent request's code path never reaches the side-effect calls, so LOGIC-02 (08-04) and LOGIC-03 (08-06) compose with zero double-fire risk
- [Phase ?]: [Phase 08-06] aktor uses req.user.username (zero extra DB query, already on the JWT payload) rather than fetching Akun.nama; route layer passes req.user.username/req.user.role as explicit trailing (aktor, role) string arguments into service calls, services never read req.user themselves
- [Phase 09-01]: THE central Phase 9 architectural decision: hydrated in-memory cache — synchronous getters (getState, getDaftarKota, etc.) keep reading from the cache unchanged; mutators become `await apiFetch(...)` then write the server's authoritative response into the cache and notify(); mutators now return Promises and call sites add a minimal await where v1.0 already ran follow-up code. Binding for 09-02 through 09-05.
- [Phase 09-01]: JWT stored in localStorage under switera_token (consistent with v1.0's plaintext-localStorage session pattern); XSS-exposure tradeoff accepted for this school-demo milestone (threat T-09-JWT); httpOnly-cookie/refresh-token hardening remains deferred to AUTH-05/06 (v2).
- [Phase 09-01]: persistState() now writes ONLY {userAktif, tema} under a new switera_session_v2 key; the v1.0 switera_state_v1 domain blob is retired — all domain collections are server-sourced from now on, cache-only client-side, filled by store.hydrate() (stub introduced here, completed in 09-05).
- [Phase 09-01]: Login no longer sends role as a credential — server returns the account's real role from username+password alone; the role pill is now a pure UI affordance. Server's single generic 401 (T-07-ENUM anti-enumeration) replaces v1.0's client-side per-field username/password/role breakdown — Login.jsx maps the one generic message onto the password field instead of re-inspecting credentials client-side.
- [Phase 09-01]: cariAkun/tambahAkun/getNextAkunId/reset() converted to loud explanatory-Error shims (not silent no-ops) since their client-side-only data no longer reflects server state; Layout.jsx's "reset demo data" control now throws until a later plan either wires a real server-side reset endpoint or removes the control.
- [Phase 09-02]: getKotaReferenceCounts changed from synchronous client-side filter to async GET /kota/:nama/references call, since client no longer holds a live permintaan/keputusan cache to filter against.
- [Phase 09-02]: Client-side cascade-rename/block-delete mirroring fully removed from updateKota/hapusKota; server (kotaService.js) is now the single integrity authority, client only displays the server's authoritative response.
- [Phase 09-02]: Removed recordActivity(...) calls from kota/stok mutators since server-side catatAktivitas (Phase 8 LOGIC-03) already logs the same actions in the same request, avoiding duplicate activity-log entries.
- [Phase 09-03]: addPermintaan's POST response is the single created row (not a full list, unlike kota's POST/PUT/DELETE which return the full collection) — store.js appends it to the cache rather than replacing the whole array; binding note for 09-04 to check keputusan's actual POST response shape before assuming either pattern.
- [Phase 09-03]: hasPermintaanDuplikat stayed un-debounced/un-batched at every call site (per-keystroke in both forms, per-row in the CSV loop) to preserve v1.0's exact synchronous-feeling validation UX, trading a network round-trip per keystroke for behavioral fidelity.
- [Phase 09-03]: Bulk CSV import loop converted from Array.forEach to a sequential awaited for-loop (not Promise.all) because duplicate-check correctness within one CSV batch depends on rows being processed left-to-right against the just-updated server state.
- [Phase 09-03]: Removed all client-side pushNotifikasi/anomaly-detection/recordActivity calls from permintaan mutators since server-side permintaanService.js (Phase 8 LOGIC-03) already performs the equivalent side effects in the same request.
- [Phase ?]: [Phase 09-04] DELETE /keputusan/:id and POST /keputusan/:id/restore both return a single row (not a full list), confirmed against keputusanService.js before writing store.js code — corrects the plan's stated full-list assumption; matches permintaan's (09-03) single-row pattern, not kota's (09-02) full-list pattern.
- [Phase ?]: [Phase 09-04] updateKeputusan never optimistically mutates the cache before the await resolves; on a 409 LOGIC-02 conflict the cache write line is never reached, verified live with two genuinely concurrent PUT requests (one 200, one 409 with the exact Indonesian conflict message) plus the same scenario driven through store.js directly via Promise.allSettled.
- [Phase ?]: [Phase 09-04] All status-change handlers (StatusDistribusi.jsx, Dashboard.jsx DashboardLogistik) apply identical 409-safe ordering: validate before await, success Toast/modal-close strictly after a successful await inside try, empty catch leaves the modal open on conflict/error.
- [Quick 260625-cvb]: Added nullable `armada String?`/`eta String?` columns to both Keputusan and RiwayatKeputusan (additive migration `20260625045406_add_armada_eta_keputusan`) to close the gap 09-04 found — `eta` is a plain `YYYY-MM-DD` string (matches StatusDistribusi.jsx's `<input type="date">`), not a DateTime, consistent with the existing `tanggalKeputusan String` convention. Wired through keputusanService's hasOwnProperty-guarded toApi/toDb mappers and keputusanUpdateSchema; verified live round-trip (PUT persists, GET reflects it).
- [Phase 09-05]: PUT /notifikasi/:id/baca returns a single updated row (confirmed against notifikasiService.js before writing store.js code) — matches the keputusan-domain single-row pattern (09-04), not kota's full-list pattern; PUT /notifikasi/baca-semua DOES return the full list (confirmed separately), so that mutator's full-list-replace is correct as the plan stated.
- [Phase 09-05]: apiClient.js now sets error.status (HTTP status code) on every thrown error, in addition to error.message/error.fields — lets loadActivityLog's 403-degrade branch on status reliably instead of message-text matching alone.
- [Phase 09-05]: store.hydrate() completed as the single global bootstrap — Promise.all over loadKota/loadStok/loadPermintaan/loadKeputusan/loadRiwayatKeputusan/loadNotifikasi/loadActivityLog, no-ops without a token, wired into App.jsx on the snapshot.userAktif?.username transition (covers both fresh login and session-restore from localStorage).
- [Phase 09-05]: AnalisisRanking/Laporan/Dashboard deliberately kept on client-side ranking computation (aggregatePermintaanRanking over the hydrated cache) rather than switching to the server's /rekomendasi-distribusi or /kpi endpoints — loadRekomendasi()/loadKpi() exist as ready-to-use loaders for a future phase, not wired into any page to avoid any risk of altering displayed numbers (FE-03).
- [Phase 09-05]: store.reset() (Layout.jsx's "Reset Data" button) repurposed from 09-01's throwing shim into an async re-hydrate (`await store.hydrate()`) — closes the 09-01 Pending Todo without inventing a new server-side reset endpoint.
- [Phase 09-05]: Fixed a real regression in Landing.jsx — since 09-01 emptied the client-side domain caches, the public marketing page's demo ranking/city-map widgets (which never call hydrate(), by design, since Landing renders pre-login) had been silently rendering with zero data. Fixed by switching to static src/data/permintaan.json + an inlined v1.0 kotaSeed constant; Landing now makes zero API calls and shows the same demo numbers as v1.0.
- [Phase ?]: [Phase 10-01]: POLL_INTERVAL_MS = 4000, documented inline - SYNC-01 wants convergence within a few seconds; 4s keeps each client's load at 7 small GETs per 4s while staying far cheaper than implementing WebSocket/SSE push (SYNC-02, explicitly deferred).
- [Phase ?]: [Phase 10-01]: startPolling() always calls stopPolling() first before creating a new interval, guaranteeing at most one live interval ever exists even under a double-start (e.g. a re-fired effect).
- [Phase ?]: [Phase 10-01]: pollTick()'s catch block intentionally never Toasts and never re-throws - a transient background poll failure is invisible work, not a user action; a 401 mid-tick is handled by the EXISTING apiClient onUnauthorized path, surfaced via App.jsx's effect cleanup calling stopPolling(), with zero new 401 handling added.
- [Phase ?]: [Phase 10-01]: Stop-on-logout/401 needed zero new wiring - App.jsx's existing useEffect on [snapshot.userAktif?.username] already re-runs its cleanup whenever the dependency becomes undefined (logout or 401); returning store.stopPolling() from that effect's cleanup is the single declarative stop hook.
- [Phase 10-02]: Used Vite ssrLoadModule (middleware-mode, no port) instead of plain node import to drive store.js in verify scripts, since store.js's extensionless imports and transitive Toast.jsx import are unresolvable/unparseable by plain Node ESM
- [Phase 10-02]: Patched the global setInterval to bind each poll timer's globalThis.window at registration time, since a naive window swap was found to let one simulated client session's poll tick silently read another client's token
- [Phase 10-02]: Task 1's client A re-logs-in as admin before its addPermintaan call since POST /permintaan is Admin-only server-side, which the plan's literal manajer/logistik pairing did not account for (Rule 1 auto-fix)

### Pending Todos

None open from Phase 9 — the only Phase 9 Pending Todo (Layout.jsx's "Reset demo data" button) was resolved in 09-05 (see below).

### Blockers/Concerns

Carried forward from v1.0 close (still open, relevant to this milestone):

- DESIGN-04/Phase 5's "no visual regression" claims were verified structurally, not pixel-confirmed in a real browser (no `chromium-cli`/Playwright available). **STILL UNRESOLVED as of Phase 9 close**: every Phase 9 plan (09-01 through 09-05) converted pages to async/REST with a structural (`git diff`) confirmation of zero JSX/styling change plus live functional verification against the real backend, but no actual rendered-browser pixel comparison was ever possible across the whole frontend — same tooling gap, now spanning all 12 pages, not just auth. Recommend installing Playwright (with explicit user approval — new dependency) before the v2.0 milestone ships.
- v2 candidate: Login.jsx's "Lupa Password?" control remains non-functional by deliberate decision — now technically unblocked by a real backend existing post-v2.0, but still out of scope for this milestone per REQUIREMENTS.md.
- v2 deferred: TEST-01 (automated tests for `distribusi.js`/`forecast.js` and new backend services) and SEC-01 (CSV injection review for user-entered city names) — both explicitly listed in REQUIREMENTS.md v2 Requirements.
- Research flags open decisions to settle during phase planning: refresh-token strategy is deliberately deferred (AUTH-04 ships single-token re-login only, no refresh flow — AUTH-05/06 are v2); concurrency-control mechanism for decision approval (DB unique constraint vs. Prisma interactive transaction) needs to be finalized during Phase 8 planning, not assumed.

New from 09-03:

- None — both deviations (field-error mapping, delete-modal-close-on-failure) were fully resolved within this plan's scope, no follow-up needed.

New from 09-04:

- ~~[Phase 09-04] armada/eta fields... NOT persisted...~~ RESOLVED via quick task 260625-cvb (see Decisions and Quick Tasks Completed below) — armada/eta now persist correctly, verified live round-trip.

New from 09-05 (Phase 9's final plan — ALL resolved within this plan, no open items carried into Phase 10):

- ~~Layout.jsx's "Reset demo data" control calls `store.reset()`, now a deprecated throwing shim~~ — RESOLVED this plan: `store.reset()` now re-hydrates from the server (async `await store.hydrate()`), closing the Pending Todo carried since 09-01.
- ~~Landing.jsx's demo ranking/city-map widgets silently rendering empty~~ — RESOLVED this plan (caught as a Rule 1 deviation, not pre-existing knowledge): switched to static seed data; see Decisions log entries for 09-05.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260624-ny8 | Buatkan README.md untuk repo Switera | 2026-06-24 | (pending) | [260624-ny8-buatkan-readme-md-untuk-repo-switera](./quick/260624-ny8-buatkan-readme-md-untuk-repo-switera/) |
| 260625-cvb | Tambahkan kolom armada/eta ke model Keputusan+RiwayatKeputusan | 2026-06-25 | c3c1aaa | [260625-cvb-tambahkan-kolom-armada-dan-eta-ke-model-](./quick/260625-cvb-tambahkan-kolom-armada-dan-eta-ke-model-/) |
| 260625-izb | Kembalikan validasi role pada login ke perilaku v1.0 | 2026-06-25 | c8e83d8 (4/4 tasks complete, checkpoint approved) | [260625-izb-kembalikan-validasi-role-pada-login-ke-p](./quick/260625-izb-kembalikan-validasi-role-pada-login-ke-p/) |
| 260702-p1v | Hapus dummy/static data frontend; Landing ambil ranking/kota dari DB via endpoint publik GET /public/landing-stats | 2026-07-02 | f26fe8e | [260702-p1v-hapus-dummy-static-data-dari-frontend-sw](./quick/260702-p1v-hapus-dummy-static-data-dari-frontend-sw/) |
| 260704-2y2 | Implementasi AI-1: ringkasan AI di halaman Laporan (endpoint POST /laporan/ringkasan via Gemini API free tier + section Ringkasan AI di Laporan.jsx) | 2026-07-04 | ea07505 | [260704-2y2-implementasi-ai-1-ringkasan-ai-di-halama](./quick/260704-2y2-implementasi-ai-1-ringkasan-ai-di-halama/) |
| 260704-3zb | Implementasi AI-2: rekomendasi keputusan AI (POST /keputusan/rekomendasi-ai + card Rekomendasi AI di KeputusanDistribusi.jsx; geminiClient.js jadi helper Gemini bersama) | 2026-07-04 | 931e6c8 | [260704-3zb-implementasi-ai-2-rekomendasi-keputusan-](./quick/260704-3zb-implementasi-ai-2-rekomendasi-keputusan-/) |
| 260710-rmc | Fitur MIS Peramalan Permintaan per Kota di AnalisisRanking (computeForecastPerKota + Sparkline, estimasi kebutuhan berikutnya vs stok) | 2026-07-10 | b89a3b3 | [260710-rmc-tambah-fitur-mis-peramalan-permintaan-pe](./quick/260710-rmc-tambah-fitur-mis-peramalan-permintaan-pe/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Quality Infra | TEST-01 (automated tests for distribusi.js/forecast.js + backend services) | Deferred to v2 Requirements | v1.0 close |
| Quality Infra | SEC-01 (CSV injection review for user-entered city names) | Deferred to v2 Requirements | v1.0 close |
| Auth | AUTH-05/AUTH-06 (refresh-token flow + rotation with reuse detection) | Deferred to v2 Requirements | v2.0 requirements definition |
| Sync | SYNC-02 (WebSocket/SSE real-time push) | Deferred to v2 Requirements | v2.0 requirements definition |

## Session Continuity

Last session: 2026-07-03T16:41:43.363Z
Stopped at: context exhaustion at 87% (2026-07-03)
Resume file: None

## Operator Next Steps

**v2.0 MILESTONE (Backend & Multi-User Migration) IS COMPLETE. All 10 phases, 18 plans done. No further phases are planned within this milestone.**

- Phase 6 (Backend Skeleton & Data Model) is complete — all 3 plans (06-01, 06-02, 06-03) executed and verified
- Phase 7 (Auth & Authorization) is complete — both plans (07-01: server-side JWT/bcrypt login + register; 07-02: requireAuth/requireRole RBAC middleware + demo protected routes + verification script) executed and verified end-to-end via curl and standalone scripts
- Phase 8 (Domain CRUD Endpoints) is COMPLETE — all 6 plans (08-01 through 08-06) executed and independently re-verified live. 08-04 closed LOGIC-02 (optimistic-lock race fix). 08-05 closed LOGIC-01 (ranking/KPI engine reading fresh on every call). 08-06 closed LOGIC-03 in full (notifikasi/activityLog REST + side-effect wiring across permintaan/keputusan/kota/stok) and retired Phase 7's throwaway /protected router. API-01 (full 7-domain REST coverage: akun, kota, stok, permintaan, keputusan+riwayatKeputusan, notifikasi, activityLog) is closed.
- Phase 9 (Frontend API-Client Integration & Loading/Error UX) is COMPLETE — all 5 plans (09-01 through 09-05) executed and verified live:
  - 09-01: `src/api/apiClient.js` created; auth (login/register/logout) converted to real JWT-backed REST; the hydrated-in-memory-cache + Promise-returning-mutator + loading/error pattern decided and proven on the auth slice.
  - 09-02: kota/stok domain converted to REST; `ManajemenKota.jsx` wired.
  - 09-03: permintaan domain converted to REST, including CSV bulk-import and delete-with-undo; `InputData.jsx`/`ManajemenData.jsx` wired.
  - 09-04: keputusan/riwayat domain converted to REST; `KeputusanDistribusi.jsx`/`StatusDistribusi.jsx`/`Dashboard.jsx` wired; the LOGIC-02 409 optimistic-lock conflict verified live under genuine concurrency.
  - 09-05 (final plan): notifikasi/activityLog domain converted to REST; distribusi read loaders (`loadRekomendasi`/`loadKpi`) added but not wired into any page (deliberate, to preserve FE-03 pixel-identical numbers); `store.hydrate()` completed and wired into `App.jsx` as the single global bootstrap on login/session-restore; `Layout.jsx`/`RiwayatAktivitas.jsx`/`AnalisisRanking.jsx`/`Laporan.jsx` wired with mount-load effects; a real Landing.jsx regression (demo widgets silently empty since 09-01) was found and fixed. Layout's "Reset Data" button now re-hydrates instead of throwing — the last Phase 9 Pending Todo is resolved.
  - All 12 pages now satisfy FE-01 (REST-backed reads/writes), FE-02 (loading/error UX via the existing isLoading/lastError + Toast mechanism), and FE-03 (pixel-identical UI, confirmed via `git diff --stat` across every plan).
  - All five plans verified live against the real Express backend (:4000, Postgres-backed via `switera-db-1`) and Vite dev server (:5173), both still running.
- **Phase 10 (Multi-Client Sync & Cross-Role UAT) is COMPLETE — this was the FINAL phase of v2.0:**
  - 10-01: SYNC-01 polling mechanism implemented — `store.js` gained `startPolling()`/`stopPolling()`/`pollTick()` (4000ms interval, fail-soft, idempotent), wired into `App.jsx`'s existing `userAktif?.username` bootstrap effect (start after hydrate on login/session-restore, stop via effect cleanup on logout/401). Verified live via Vite's `ssrLoadModule` against the real backend.
  - 10-02 (final plan of the final phase): three multi-client verify scripts added under `server/src/sync/` — `multiClientSync.verify.mjs` (SYNC-01 convergence through a real second session's poll tick, plus stop-halts-sync proof), `multiClientRbac.verify.mjs` (Phase 7 RBAC 403 denial re-proven under active dual-client polling, Success Criterion 3), `multiClientRace.verify.mjs` (Phase 8 LOGIC-02 exactly-one-winner re-proven through two real logged-in client sessions under polling, Success Criterion 4, stable across 3 runs). All self-cleaning/idempotent. SYNC-01 requirement is now CLOSED with executable multi-client evidence.
- **All v2.0 requirements (SYNC-01 and everything from Phases 6-9) are closed. There is no Phase 11 — this milestone's roadmap ends at Phase 10.**
- **Recommended (not blocking) next steps:**
  1. A manual two-browser-tab visual check of cross-client convergence (open two tabs as two different roles, mutate in one, confirm the other updates within ~4s with no refresh) — the one piece of Success Criteria 1/2 that automated scripts could not cover (no Playwright/chromium-cli in this environment). See 10-02-SUMMARY.md "Manual/Live Verification" for the exact steps.
  2. Run a milestone close-out workflow (e.g. `/gsd-complete-milestone`) to archive v2.0 and prepare for whatever comes next (v2 deferred items are listed below in "Deferred Items": TEST-01, SEC-01, AUTH-05/06, SYNC-02).
- Carried-forward concern (not blocking, unresolved across all of Phases 5/6-9/10): no Playwright/chromium-cli available in this environment — every "pixel-identical"/"no visual regression" claim across the whole v2.0 migration, plus this final phase's convergence claim, has been verified structurally (`git diff`) and via live backend protocol/JavaScript-execution-level checks, never via an actual rendered-browser screenshot comparison. Consider installing Playwright (with explicit user approval — new dependency) if any future milestone adds significant UI work.
