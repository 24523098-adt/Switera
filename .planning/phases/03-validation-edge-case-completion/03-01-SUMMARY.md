---
phase: 03-validation-edge-case-completion
plan: 01
subsystem: auth
tags: [react, validation, forms, store-convention]

# Dependency graph
requires: []
provides:
  - "store.getNextAkunId() public method wrapping the existing private getNextId(items, prefix) helper for daftarAkun"
  - "Field-level inline error rendering in Login.jsx (errors.username, errors.password, errors.role)"
affects: [03-02 (StatusDistribusi/InputData validation, same phase, no file overlap), future auth-page work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Field-level errors object (errors.field) instead of single error string, rendered via existing ErrorText component — extends the InputData.jsx validation pattern to auth pages"
    - "Ambiguous auth-failure messaging: when store.cariAkun() returns null, both username and password error messages render together since the boolean result can't distinguish which credential was wrong"

key-files:
  created: []
  modified:
    - src/store.js
    - src/pages/Register.jsx
    - src/pages/Login.jsx

key-decisions:
  - "getNextAkunId() placed directly after tambahAkun() in store.js to keep akun-related methods grouped, per plan instruction"
  - "New Register IDs follow U-004/U-005 format (hyphenated, per getNextId's template) while seeded accounts remain U001/U002/U003 (no hyphen) — expected divergence, the convention is the function not byte-identical formatting with legacy seed data"
  - "Login auth-fail case shows both username and password error messages simultaneously rather than picking one — matches UI-SPEC's documented fallback for cariAkun's single boolean result, accepted in threat model as non-enumerating (both messages always co-occur, never just one)"

requirements-completed: [VALID-01, VALID-04]

# Metrics
duration: 16min
completed: 2026-06-24
status: complete
---

# Phase 3 Plan 1: Login Field-Level Errors + Register ID Convention Summary

**Login.jsx now renders three independently-clearing field-level inline errors (username/password/role) instead of one generic string, and Register.jsx mints account IDs via a new store.getNextAkunId() wrapper instead of Date.now().**

## Performance

- **Duration:** 16 min
- **Started:** 2026-06-24T02:47:00Z (approx, from STATE.md session continuity)
- **Completed:** 2026-06-24T03:03:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `store.js` exposes `getNextAkunId()`, a thin public wrapper around the existing private `getNextId(state.daftarAkun, "U")` helper — closes the convention gap between Register's account creation and every other ID-minting call site in the store (notifications, activity log, permintaan, keputusan)
- `Register.jsx`'s `handleSubmit` now calls `store.getNextAkunId()` instead of constructing `` `U${Date.now()}` `` — verified via direct logic simulation that the next ID for the seeded U001/U002/U003 accounts is `U-004`, matching the `^U-\d{3}$` format
- `Login.jsx` replaced its single `error` string state with an `errors` object (`username`, `password`, `role` keys), each rendered through three separate `<ErrorText>` calls positioned directly below their respective fields
- Each field's error now clears independently on that field's own `onChange` (or `onSelectRole` for role) — fixing the prior behavior where any keystroke in either field cleared the single shared error
- Verified end-to-end with a headless-browser run against the actual dev server (not just grep): blank submit shows both "Username wajib diisi." and "Password wajib diisi." simultaneously under their own fields; wrong-password attempt shows "Username tidak ditemukan." and "Password salah untuk akun ini." together; correct credentials still navigate to `/dashboard` with zero error elements rendered — confirming no regression to the happy path

## Task Commits

Each task was committed atomically:

1. **Task 1: Add store.getNextAkunId() and switch Register.jsx off Date.now()** - `bf36acf` (feat)
2. **Task 2: Split Login.jsx's single error string into field-level inline errors** - `9e40693` (fix)

_Note: per project config (`commit_docs: false`), this SUMMARY/STATE/ROADMAP commit is intentionally batched separately by the operator — not committed here._

## Files Created/Modified
- `src/store.js` - Added `getNextAkunId()` method (line 213-215), placed directly after `tambahAkun()` per plan instruction, wrapping the existing private `getNextId(items, prefix)` helper
- `src/pages/Register.jsx` - `handleSubmit`'s `tambahAkun()` call now sources `id` from `store.getNextAkunId()` instead of `` `U${Date.now()}` ``; no other fields or validation logic touched
- `src/pages/Login.jsx` - Replaced `const [error, setError] = useState("")` with `const [errors, setErrors] = useState({})`; rewrote `handleSubmit` to build a `nextErrors` object per-field before falling through to `store.cariAkun()`; updated username/password `onChange` handlers and added an `onSelectRole` wrapper to clear only their own field's error; replaced the single combined `<ErrorText>` render with three separate renders positioned after the RolePills, username field, and password field respectively

## Decisions Made
- New Register account IDs intentionally diverge in format from the three legacy seeded accounts (`U-004` vs `U001`) — this is the documented, accepted outcome of adopting the shared `getNextId` convention; the plan's traceability note explicitly calls this out as expected, not a defect
- Login's auth-failure path (wrong username, wrong password, or wrong role combination) cannot distinguish which single field was wrong because `store.cariAkun()` returns one boolean-like result — both `errors.username` and `errors.password` are set together on auth failure, matching the UI-SPEC's documented two-message fallback and the threat model's accepted disposition (T-03-01: this doesn't introduce a new username-enumeration oracle since both messages always co-occur)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. One verification-tooling note: the project has no test runner or browser-automation tooling configured (confirmed via CLAUDE.md and `package.json`), and the `run` skill's preferred `chromium-cli` tool was not available in this environment. Manual behavior verification was still completed by installing `playwright` into an isolated `/tmp` directory (not touching the project's `package.json`/`package-lock.json` or any tracked file) and driving the actual `npm run dev` server through all three required scenarios with screenshots confirming the rendered DOM. The temp Playwright installation and dev server process were both cleaned up after verification; no trace remains in the repository.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- VALID-01 and VALID-04 are closed; both Login.jsx and Register.jsx behave per the UI-SPEC's Copywriting Contract section
- Plan 03-02 (StatusDistribusi.jsx armada/ETA validation, InputData.jsx empty-city-list handling — VALID-02, VALID-03) executes next on this same working tree; it touches different files (`src/pages/StatusDistribusi.jsx`, `src/pages/InputData.jsx`) with no overlap against this plan's changes
- No blockers identified for the remainder of Phase 3

---
*Phase: 03-validation-edge-case-completion*
*Completed: 2026-06-24*
