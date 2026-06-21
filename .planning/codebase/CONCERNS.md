# Codebase Concerns

**Analysis Date:** 2026-06-21

## Tech Debt

**Hand-rolled store with full-state cloning:**
- Issue: Every store getter and every `notify()` call deep-clones the entire state via `JSON.parse(JSON.stringify(...))` (`src/store.js:46`, used throughout `getState`, `getDaftarAkun`, `getPermintaan`, etc.)
- Why: Simple way to prevent callers from mutating internal state without a real state-management library
- Impact: Cost scales with total state size on every read and every mutation; will degrade as `permintaan`/`keputusan`/`activityLog` arrays grow
- Fix approach: Introduce structural sharing (e.g. Immer) or a real state library (Zustand/Redux) instead of manual deep clone

**Manual routing instead of React Router:**
- Issue: `src/App.jsx:18-165` implements routing by hand with `window.history.pushState`, a `pageRegistry`/`pathByPage`/`pageByPath` lookup, and a chain of 4 interdependent `useEffect`s (lines 90-134) to reconcile route, role, and auth state
- Why: Avoids adding a router dependency for a small number of routes
- Impact: Hard to reason about precedence when route/role/auth change simultaneously; easy to introduce a redirect loop when adding a new page
- Fix approach: Migrate to `react-router-dom`, which would collapse the `useEffect` chain into declarative route guards

**Monolithic page components:**
- Issue: `src/pages/Landing.jsx` (1619 lines), `src/pages/Dashboard.jsx` (1534 lines), `src/components/Layout.jsx` (899 lines) mix layout, state, and business logic in single files
- Why: Organic growth without extraction as features were added
- Impact: Hard to review changes in isolation; high merge-conflict risk if multiple people touch the same page
- Fix approach: Extract sub-sections into `src/components/` as the files grow further; no urgency while solo-maintained

**Duplicate date fields with fallback logic:**
- Issue: `normalizePermintaanEntry` (`src/store.js:47-51`) maintains both `tanggal_permintaan` and `tanggal_input`, each falling back to the other
- Why: Likely a schema rename mid-development that was never fully cleaned up
- Impact: Ambiguous which field is authoritative; risk of the two diverging silently
- Fix approach: Pick one field name, migrate seed data (`src/data/permintaan.json`) and all readers to it, drop the fallback

**Inline style duplication despite design tokens:**
- Issue: `src/components/auth/AuthShared.jsx`, `src/pages/Login.jsx`, `src/pages/Register.jsx` repeat inline style objects rather than using the tokens already defined in `src/tokens.css`
- Why: Auth pages likely built before/separately from the token system
- Impact: Visual drift between auth pages and the rest of the app over time
- Fix approach: Replace inline styles with token-based CSS classes, consistent with the rest of the app

## Known Bugs

No specific reproducible bugs were identified during this analysis — none were found in code comments, TODOs, or obviously inconsistent logic. Revisit this section once user-reported issues surface.

## Security Considerations

**Plaintext password storage and comparison:**
- Risk: `src/store.js:7-29` hardcodes seed account passwords in plaintext (e.g. `admin` / `admin123`); `cariAkun` (`src/store.js:213-223`) does a plain string equality check against `state.daftarAkun`; passwords persist to `window.localStorage` in plaintext via `persistState` (`src/store.js:109-119`)
- Current mitigation: None
- Recommendations: This is fine for a local demo/prototype but must not be treated as real authentication. If real users/credentials are ever introduced, this entire model needs a server-side auth provider with hashed passwords — do not extend the current scheme.

**Authorization is UI-only:**
- Risk: Role-based page gating (`src/App.jsx:104-121`, `src/utils/navigation.js`) only controls which pages are *rendered*; nothing prevents calling any `store` mutator directly (e.g. from the browser console) regardless of role
- Current mitigation: None — there is no enforcement layer because there is no server
- Recommendations: Acceptable for a client-only demo app where all "users" are trusted operators of the same browser session; becomes a real risk only if this architecture is ever connected to a shared backend with real users

**CSV export not reviewed for injection:**
- Risk: `src/utils/csv.js` generates exported CSV from user-entered fields (city names, request quantities); CSV injection (formula injection via leading `=`, `+`, `-`, `@`) was not ruled out
- Current mitigation: Unknown — not verified in this pass
- Recommendations: When touching `csv.js`, confirm cell values are sanitized/prefixed before export, especially for fields that accept free text

## Performance Bottlenecks

**Full-state `localStorage` write on every mutation:**
- Problem: `persistState()` (`src/store.js:109-119`) serializes and writes the *entire* application state to `localStorage` synchronously, on every single mutator call, with no debouncing or batching
- Measurement: Not benchmarked — currently low-risk given small seed dataset sizes (`src/data/*.json`), but cost grows linearly with `permintaan`/`keputusan`/`activityLog`/`notifikasi` array length
- Cause: Simplicity of the "write everything every time" approach
- Improvement path: Debounce writes, or persist only the changed slice of state

**Deep clone on every store read:**
- Problem: `clone()` (`src/store.js:46`) uses `JSON.parse(JSON.stringify(value))` and is called on nearly every getter and on every `notify()` broadcast to subscribers
- Measurement: Not benchmarked — same growth concern as above
- Cause: Defensive copying to avoid external mutation of internal state
- Improvement path: Switch to structural sharing (Immer) so unchanged sub-trees aren't re-serialized

## Fragile Areas

**Route/role/auth reconciliation in App.jsx:**
- Why fragile: Four separate `useEffect` hooks (`src/App.jsx:90-134`) read and write overlapping pieces of state (`route`, `activePage`, `snapshot.userAktif`, `snapshot.roleAktif`) with implicit ordering dependencies
- Common failures: Adding a new page or role without updating all four effects risks redirect loops or a blank page
- Safe modification: Trace all four effects together before changing any one; consider adding the new page to `pageRegistry`/`pathByPage`/`navigation.js` first, then test login as each of the three roles
- Test coverage: None (no tests exist anywhere in the repo)

**Legacy `daftarKota` shape silently discarded:**
- Why fragile: `isLegacyDaftarKota` (`src/store.js:80-81`) detects an old shape (array of strings) and silently resets to seed data (`src/store.js:100`) with no warning to the user
- Common failures: A user with old `localStorage` data from a previous version of the app would lose their custom city list without any notification
- Safe modification: If changing `daftarKota`'s shape again, add a visible migration notice rather than silent reset
- Test coverage: None

**Sequential ID generation via digit-stripping:**
- Why fragile: `getNextId` (`src/store.js:53-61`) derives the next numeric ID by stripping non-digit characters from existing IDs and taking `max + 1`
- Common failures: Any manually-edited or imported ID that doesn't follow the `PREFIX-NNN` convention could produce unexpected ID collisions or `NaN` handling
- Safe modification: Keep all IDs machine-generated through this function; avoid hand-editing seed JSON IDs
- Test coverage: None

## Scaling Limits

**Client-only architecture:**
- Current capacity: Single-browser, single-user — there is no multi-user concept; `localStorage` is per-browser-profile
- Limit: Cannot support more than one operator seeing shared/live data; no concept of concurrent edits
- Symptoms at limit: Two people "using the system" in different browsers will see divergent, non-synced data
- Scaling path: Would require introducing a real backend (API + database) — a significant architectural change, not an incremental one

## Dependencies at Risk

No outdated or unmaintained dependencies identified — `react`, `react-dom`, `vite`, `leaflet`, `chart.js`/`react-chartjs-2` are all current, actively maintained packages as of this analysis.

## Missing Critical Features

**No automated tests:**
- Problem: Zero test coverage across the entire codebase, including the core decision-support calculations in `src/utils/distribusi.js` and `src/utils/forecast.js`
- Current workaround: Manual testing in the browser only
- Blocks: Any refactor of `distribusi.js`/`forecast.js` carries real risk of silently changing the distribution recommendations the app produces
- Implementation complexity: Low to start — Vitest integrates with the existing Vite config with minimal setup; the utils layer is already framework-free and easy to unit test

**No linting/formatting tooling:**
- Problem: No ESLint or Prettier config exists, so style/quality drift is unchecked
- Current workaround: None
- Blocks: Nothing functionally, but increases review burden as the codebase grows
- Implementation complexity: Low — adding `eslint` + a React preset is a small, isolated change

## Test Coverage Gaps

**Distribution/ranking/forecasting logic:**
- What's not tested: `computeRekomendasiDistribusi`, `computeKpiMetrics`, `aggregatePermintaanRanking` (`src/utils/distribusi.js`) and `computeForecastPerKota` (`src/utils/forecast.js`)
- Risk: These functions produce the actual decision-support output (which city gets how much TBS) — a silent regression here directly affects real distribution decisions
- Priority: High
- Difficulty to test: Low — pure functions, no React/store dependency, straightforward to unit test with fixture data

**Store mutators:**
- What's not tested: All ~30 methods on the `store` object (`src/store.js`), including auth (`cariAkun`), persistence, and notification side effects
- Risk: Regressions could silently corrupt persisted state or break notifications/activity logging
- Priority: Medium
- Difficulty to test: Medium — requires mocking `window.localStorage`

---

*Concerns audit: 2026-06-21*
*Update as issues are fixed or new ones discovered*
