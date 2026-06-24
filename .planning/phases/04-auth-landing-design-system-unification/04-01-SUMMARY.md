---
phase: 04-auth-landing-design-system-unification
plan: 01
subsystem: ui
tags: [react, design-system, auth]

requires:
  - phase: 01-admin-city-stock-management
    provides: src/components/Tombol.jsx shared button component
provides:
  - Login.jsx submit button rendered via shared Tombol
  - Register.jsx submit button rendered via shared Tombol (disabled-on-success preserved)
affects: [04-02 (Landing.jsx Tombol migration, same shared component)]

tech-stack:
  added: []
  patterns:
    - "Auth pages adopt shared Tombol for primary submit actions instead of bespoke .auth-submit-btn markup"

key-files:
  created: []
  modified:
    - src/pages/Login.jsx
    - src/pages/Register.jsx

key-decisions:
  - "Removed now-unused per-file submitRipple useRipple() instances since Tombol provides its own ripple internally; linkRipple/RippleSpans for the secondary link buttons were left untouched"

patterns-established:
  - "Tombol's style prop is the sanctioned escape hatch for layout-specific overrides (width: 100%, marginTop) without touching the shared component source"

requirements-completed: [DESIGN-02, DESIGN-03]

duration: ~10min
completed: 2026-06-24
status: complete
---

# Phase 4 Plan 01: Auth Submit Buttons → Shared Tombol Summary

**Login and Register submit buttons now render through the shared `Tombol` component instead of a bespoke `.auth-submit-btn`, with all auth logic, validation, and copy preserved exactly.**

## Performance

- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Login's "Masuk" submit button migrated to `<Tombol type="submit" label="Masuk" variant="primer" style={{ width: "100%" }} />`
- Register's "Daftar Sekarang" submit button migrated to `<Tombol>`, preserving `disabled={Boolean(successMessage)}` (prevents double-submit during the 2s auto-redirect)
- Dead `submitRipple` hook instances removed from both files (Tombol handles its own ripple)
- Zero edits to `src/components/Tombol.jsx`, `src/components/auth/AuthShared.jsx`, `src/components/IkonDaun.jsx`

## Task Commits

1. **Task 1: Migrate Login submit button to Tombol** - `2636f6d` (feat)
2. **Task 2: Migrate Register submit button to Tombol** - `14af390` (feat)

## Files Created/Modified
- `src/pages/Login.jsx` - submit button now `<Tombol>`, `submitRipple` removed
- `src/pages/Register.jsx` - submit button now `<Tombol>` with disabled-on-success, `submitRipple` removed

## Decisions Made
None beyond what the plan specified - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
Plan 04-02 (Landing.jsx) can proceed independently - no shared files overlap with this plan. DESIGN-04 visual-regression spot-check (Dashboard.jsx, ManajemenKota.jsx, etc.) is covered by 04-02's Task 4, not duplicated here.

---
*Phase: 04-auth-landing-design-system-unification*
*Completed: 2026-06-24*
