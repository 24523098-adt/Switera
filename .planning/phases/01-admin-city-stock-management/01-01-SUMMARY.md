---
phase: 01-admin-city-stock-management
plan: 01
subsystem: ui
tags: [react, brownfield, admin, navigation, crud-scaffold]

# Dependency graph
requires:
  - phase: 00 (existing codebase)
    provides: store.js getDaftarKota/getKapasitasKota/getStokTbs/setStokTbs methods, shared component library (PageHeader, SectionHeader, Tabel, MetricCard, EmptyState, Card, Tombol, Modal), navigation/role-gating pattern
provides:
  - Admin-only "Manajemen Kota" page reachable from the sidebar at /manajemen-kota
  - Read-only city list table (ADMIN-01) and TBS stock summary card (ADMIN-05 read side)
  - Page/route/menu/icon scaffold ready for CRUD wiring in plans 02 and 03
affects: [01-02-PLAN.md, 01-03-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-registry page registration: App.jsx (pageRegistry + pathByPage) + navigation.js (menuByRole.Admin) + Layout.jsx (IkonMenu case) edited together in one commit to avoid silent Dashboard fallback"
    - "Snapshot-subscribe data flow: useState(store.getState()) + store.subscribe in useEffect, derive view data via useMemo from snapshot fields only (never call store getters during render)"

key-files:
  created:
    - src/pages/ManajemenKota.jsx
  modified:
    - src/App.jsx
    - src/utils/navigation.js
    - src/components/Layout.jsx

key-decisions:
  - "Cities remain keyed by `nama` (string), no synthetic id field introduced — matches existing store.js contract"
  - "Add/Edit/Delete/Stock-edit actions rendered as no-op placeholders in this plan to establish final page layout early; wiring deferred to plans 02 (city CRUD) and 03 (stock editor) per the vertical-slice plan split"

patterns-established:
  - "AksiTabelButtons presentational pattern copied verbatim from ManajemenData.jsx for row-level Edit/Hapus actions, reused with no-op handlers until CRUD plans wire them"

requirements-completed: [ADMIN-01, ADMIN-05]

# Metrics
duration: 4min
completed: 2026-06-21
status: complete
---

# Phase 1 Plan 1: Manajemen Kota Page Scaffold Summary

**Admin-only "Manajemen Kota" page with reactive city table and TBS stock card, registered across all three navigation registries**

## Performance

- **Duration:** ~4 min (task commits 6 seconds apart; checkpoint verification time excluded)
- **Started:** 2026-06-21T07:14:16Z
- **Completed:** 2026-06-21T09:57:41Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- New "Manajemen Kota" sidebar item, visible to Admin only, with a distinct city/building icon (not reusing the "database" glyph already used by Manajemen Data)
- `src/pages/ManajemenKota.jsx` created: snapshot-subscribe component rendering a city table (Nama Kota, Kapasitas (ton)) sourced from `snapshot.daftarKota`, plus a `MetricCard` showing `snapshot.stokTbs` ("Stok TBS Tersedia (ton)")
- Page registered in `pageRegistry`/`pathByPage` (App.jsx) so it renders at `/manajemen-kota` instead of silently falling back to Dashboard
- Manual UAT confirmed in browser (dev server localhost:5175): 8 seed cities render correctly with kapasitas values, stock card shows ~150 ton, and the menu item correctly does NOT appear for Manajer Distribusi or Tim Logistik with no redirect loop

## Task Commits

Each task was committed atomically:

1. **Task 1: Register Manajemen Kota page across registries + city icon** - `488c1b2` (feat)
2. **Task 2: Create ManajemenKota.jsx — snapshot-subscribe, city table, stock summary card** - `2606d22` (feat)
3. **Task 3: Human verify — reachable Admin-only Manajemen Kota page** - checkpoint, approved by user (no code commit; verification gate only)

**Plan metadata:** (this commit, following this SUMMARY)

## Files Created/Modified
- `src/pages/ManajemenKota.jsx` - New page: snapshot-subscribe, city table (read-only), TBS stock summary card, empty-state copy, Add/Edit/Delete placeholders for later plans
- `src/App.jsx` - Added `ManajemenKota` import + `manajemen-kota` entries in `pageRegistry` and `pathByPage`
- `src/utils/navigation.js` - Added `{ key: "manajemen-kota", label: "Manajemen Kota", icon: "city" }` to `menuByRole.Admin` only
- `src/components/Layout.jsx` - Added new `case "city":` to the `IkonMenu` switch with a two-stroke building/house glyph distinct from `"database"`

## Decisions Made
- Cities stay keyed by `nama` string; no `id` field or `getNextId` call introduced, consistent with the existing `store.js` contract (`getDaftarKota`, `getKapasitasKota`).
- Add/Edit/Delete and stock-edit interactions are rendered now as no-op placeholder buttons so the final page layout (header action, stock card edit button, table row actions) is locked in during this read-only slice, avoiding layout churn when plans 02/03 wire real handlers.
- Stock card and city table both derive exclusively from the subscribed `snapshot` object (`snapshot.daftarKota`, `snapshot.stokTbs`), never calling store getters directly inside render, keeping the page reactive without manual refresh.

## Deviations from Plan

None - plan executed exactly as written. Task 1 and Task 2 implementations matched the plan's `<action>` and `<acceptance_criteria>` exactly; both automated verify commands (registry presence checks, snapshot-subscribe checks) passed prior to commit, and `npm run build` succeeds.

## Issues Encountered

None during automated execution. The checkpoint (Task 3) required human browser verification, which the user completed and approved: confirmed icon distinctness, correct route rendering (not Dashboard fallback), all 8 seed cities with correct kapasitas, stock card showing ~150 ton, and correct role-exclusion for Manajer Distribusi and Tim Logistik with no redirect loop.

## User Setup Required

None - no external service configuration required. This is a client-only React SPA change; no environment variables, API keys, or dashboard configuration involved.

## Next Phase Readiness
- The page scaffold, routing, role-gating, and reactive data flow are all in place and verified by the user in-browser.
- Plan 02 can wire the "+ Tambah Kota" button, the city table's Edit/Hapus row actions, and the rename/delete-with-existing-references product decision (still an open blocker per STATE.md) directly onto the existing placeholders without touching layout.
- Plan 03 can wire the stock card's "Edit" button to `store.setStokTbs`, confirming first whether `utils/distribusi.js`'s recommendation engine reads `getStokTbs()` directly or via an argument (open STATE.md concern), so the new editor doesn't bypass that read path.

---
*Phase: 01-admin-city-stock-management*
*Completed: 2026-06-21*

## Self-Check: PASSED

- FOUND: src/pages/ManajemenKota.jsx
- FOUND: .planning/phases/01-admin-city-stock-management/01-01-SUMMARY.md
- FOUND: 488c1b2 (Task 1 commit)
- FOUND: 2606d22 (Task 2 commit)
