---
phase: 02-role-differentiated-reporting
plan: 01
subsystem: ui
tags: [react, chartjs, reporting, role-based-rendering]

# Dependency graph
requires:
  - phase: 01-admin-city-stock-management
    provides: Stable store.js contract for keputusan/riwayatKeputusan collections (no schema changes needed)
provides:
  - Role-conditional Laporan.jsx with two materially different data views (Manajer Distribusi vs Tim Logistik)
  - New GrafikStatusPengiriman doughnut chart component
  - Role-conditional CSV export (filename + columns differ per role)
affects: [phase-3-validation-sweep, phase-5-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role branching via isTimLogistik boolean derived from validated roleAktif, gating both data-layer useMemo selection and JSX render branch"
    - "Second chart.js/auto lifecycle component (GrafikStatusPengiriman) replicating GrafikTrenPermintaan's dynamic-import + isActive-flag + cleanup pattern for a doughnut chart"

key-files:
  created: []
  modified:
    - src/pages/Laporan.jsx

key-decisions:
  - "Renamed tableRows to tableRowsManajer (not left as-is) to keep both role row-arrays visually distinct and avoid ambiguity — required updating the one JSX usage site"
  - "noData computed conditionally per role (Tim Logistik checks filteredKeputusan + statusCounts; Manajer Distribusi keeps original filteredRiwayat + chartConfig check) rather than a unified formula, since the two roles' data sources are structurally different"
  - "GrafikStatusPengiriman uses doughnut chart type (not bar) per UI-SPEC.md's 'executor decides' discretion — doughnut better communicates proportion-of-whole for 3 status categories"

patterns-established:
  - "Pattern 1: Role-conditional pages branch both the data layer (useMemo selecting which store collection to read) and the render layer (JSX ternary on the same boolean), keeping the outer empty-state/fragment wrapper shared and only the inner content blocks role-specific"

requirements-completed: [REPORT-01, REPORT-02, REPORT-03]

# Metrics
duration: 18min
completed: 2026-06-24
status: complete
---

# Phase 2 Plan 1: Role-Differentiated Laporan Summary

**Laporan.jsx now branches on `roleAktif` to render two structurally different reports: Manajer Distribusi keeps the Riwayat Keputusan table + Tren Permintaan line chart (unchanged), while Tim Logistik gets a new Distribusi Aktif table with Armada/ETA column plus a Status Pengiriman doughnut chart, both reading from `snapshot.keputusan` instead of `snapshot.riwayatKeputusan`/`snapshot.permintaan`.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-06-24T02:30:00Z
- **Completed:** 2026-06-24T02:48:00Z
- **Tasks:** 2 completed
- **Files modified:** 1 (`src/pages/Laporan.jsx`)

## Accomplishments

- Added a complete role-conditional data layer: `filteredKeputusan` (new useMemo sourcing `snapshot.keputusan`), `statusCounts` (status tally for the chart), `tableRowsTimLogistik` (with armada/ETA concatenation matching StatusDistribusi.jsx's pattern), and `tableRowsManajer` (renamed from the original `tableRows`)
- Built `GrafikStatusPengiriman`, a new doughnut chart component using the exact same chart.js/auto lifecycle (dynamic import, `isActive` flag, cleanup-on-unmount, skeleton/error states) as the existing `GrafikTrenPermintaan`
- Branched the full JSX render tree on `isTimLogistik`: page heading/description, primary table card, secondary chart card, and both tables' empty-state copy now differ per role while sharing the same outer `noData` / Card / SectionHeader / EmptyState shell
- Branched `handleExportCsv` so Tim Logistik downloads `laporan-status-{periode}.csv` with armada/eta/status columns, while Manajer Distribusi's export is byte-for-byte unchanged (`laporan-distribusi-{periode}.csv`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add role-conditional data layer and Tim Logistik table to Laporan.jsx** - `c73b353` (feat)
2. **Task 2: Add GrafikStatusPengiriman chart, branch the JSX render and CSV export by role** - `be7ec85` (feat)

**Plan metadata:** not committed this run — `commit_docs: false` in `.planning/config.json` (operator is batching `.planning/` doc commits separately; SUMMARY.md/STATE.md/ROADMAP.md are written to disk as usual but intentionally left uncommitted here)

## Files Created/Modified

- `src/pages/Laporan.jsx` - Rebuilt with role-conditional data layer (`isTimLogistik`, `filteredKeputusan`, `statusCounts`, `tableRowsManajer`, `tableRowsTimLogistik`), a new `GrafikStatusPengiriman` doughnut chart component, and role-branched JSX render + CSV export. Manajer Distribusi's rendered output and CSV export are byte-identical to pre-change behavior; only Tim Logistik's branch is new.

## Decisions Made

- Renamed `tableRows` → `tableRowsManajer` per plan instruction, which required fixing one JSX usage site (`<Tabel data={tableRows}>` → `<Tabel data={tableRowsManajer}>`) immediately in Task 1 rather than deferring to Task 2, to avoid leaving an undefined-variable runtime bug in the working tree between tasks (Vite's build doesn't type-check, so this would not have failed `npm run build` — caught via a manual grep sweep for dangling `tableRows` references after Task 1's first build)
- Chose doughnut over bar chart for `GrafikStatusPengiriman`, exercising the "executor decides" discretion the UI-SPEC.md explicitly granted — doughnut communicates proportion-of-total most clearly for exactly 3 status categories
- `noData` logic kept as two separate conditional branches (not unified into one formula) since Tim Logistik and Manajer Distribusi check different underlying collections — forcing a single formula would have made the boolean logic harder to read for no benefit

## Deviations from Plan

None - plan executed exactly as written. The one extra fix (updating the `tableRows` JSX reference during Task 1 instead of strictly "not touching render" as the task's last line stated) was already implied by the same task's instruction to "update its one usage at the `<Tabel data={...}>` call" — not a deviation, just resolving an internal ordering ambiguity in the task text in favor of leaving no broken intermediate state.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REPORT-01, REPORT-02, REPORT-03 all satisfied: Manajer Distribusi view unchanged (regression-safe), Tim Logistik view is materially different (distinct table columns, distinct chart type, distinct CSV contract), and the branch point (`isTimLogistik`) is driven by the same validated `roleAktif` already used elsewhere in the app.
- `npm run build` passes cleanly; no new dependencies introduced (reuses existing `chart.js/auto`).
- Phase 2 has only this one plan (02-01) per the phase's `files_modified` scope — phase is ready for `/gsd-verify-work` and transition to Phase 3 (validation sweep) once the operator's batched `.planning/` doc commit lands.

---
*Phase: 02-role-differentiated-reporting*
*Completed: 2026-06-24*
