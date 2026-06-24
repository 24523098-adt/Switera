---
phase: 02-role-differentiated-reporting
reviewed: 2026-06-24T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/pages/Laporan.jsx
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-24
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`src/pages/Laporan.jsx` was rebuilt to branch rendering, data sourcing, and CSV export by `roleAktif`, per `02-01-PLAN.md` and `02-UI-SPEC.md`. The implementation was cross-checked against `src/utils/distribusi.js`, `src/utils/csv.js`, `src/utils/format.js`, `src/store.js` (`keputusan`/`riwayatKeputusan` mutators), `src/components/Tabel.jsx`, `Badge.jsx`, `Card.jsx`, `PageHeader.jsx`, `EmptyState.jsx`, and the sibling `StatusDistribusi.jsx` pattern it mirrors.

The data-layer branching (`filteredKeputusan` vs `filteredRiwayat`/`filteredPermintaan`), the new `GrafikStatusPengiriman` doughnut chart, and the role-conditional CSV export all match the plan's must-haves and the UI-SPEC's data/copy contract. No critical defects (security, crash, data loss) were found. The findings below are a real correctness fragility in status-count handling, plus minor robustness/maintainability gaps that should be addressed before this is considered fully hardened.

## Warnings

### WR-01: `statusCounts` silently drops any keputusan status outside the three known keys

**File:** `src/pages/Laporan.jsx:357-365`
**Issue:** `statusCounts` initializes only `{ menunggu: 0, "dalam-pengiriman": 0, selesai: 0 }` and increments via `if (counts[item.status] !== undefined) counts[item.status] += 1;` (line 360-362). Any `keputusan` entry whose `status` is not one of these three exact keys is counted nowhere — it does not throw, it does not appear in the Status Pengiriman doughnut, and it is silently excluded from the `total` used to decide whether to render the chart or its empty state (lines 210/503). Under current store invariants this is safe in practice (`removeKeputusan` strips entries with `dibatalkan` out of `state.keputusan` entirely — see `src/store.js:472-483` — and `restoreKeputusan` re-adds them with their pre-cancellation status), but that safety depends entirely on an implicit, undocumented invariant in `store.js` that this file does not enforce or even comment on. If a future store change ever leaves a non-{menunggu, dalam-pengiriman, selesai} status in `state.keputusan` (e.g. a new status value, or a regression in `removeKeputusan`), the Tim Logistik chart and `noData` calculation would quietly under-report without any error surfaced to the user or developer.
**Fix:** Either widen the guard to capture unknown statuses defensively, or add a short comment documenting the invariant this relies on:
```javascript
const statusCounts = useMemo(() => {
  const counts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
  filteredKeputusan.forEach((item) => {
    // keputusan never contains "dibatalkan" — removeKeputusan() strips
    // cancelled entries out of state.keputusan (see store.js removeKeputusan).
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  });
  return counts;
}, [filteredKeputusan]);
```

## Info

### IN-01: `GrafikStatusPengiriman` recomputes `total` outside the memoized counts on every render

**File:** `src/pages/Laporan.jsx:210`
**Issue:** `const total = counts.menunggu + counts["dalam-pengiriman"] + counts.selesai;` runs on every render of `GrafikStatusPengiriman`, recomputing a value that is fully derivable from the already-memoized `counts` prop. This is harmless today (cheap arithmetic, `statusCounts` itself is memoized) but duplicates the same three-key sum that's computed twice more at the call sites (`Laporan.jsx:411-413` and `:503`), which is a maintenance smell — if a status key is ever added, this sum has to be updated in three separate places consistently.
**Fix:** Compute the total once in the shared `statusCounts` useMemo and reuse it everywhere, or expose a small `getStatusTotal(counts)` helper next to `statusLabels`.

### IN-02: Magic three-key status sum repeated three times

**File:** `src/pages/Laporan.jsx:210, 411-413, 503`
**Issue:** The expression `counts.menunggu + counts["dalam-pengiriman"] + counts.selesai` (or its `statusCounts.*` equivalent) is duplicated verbatim in three locations: inside `GrafikStatusPengiriman`, inside the `noData` ternary, and inside the JSX render gate for the chart/empty-state branch. Any future addition of a new delivery status requires updating all three call sites in lockstep, and missing one silently breaks only one of the three behaviors (chart guard, empty-state copy, or noData banner) without a build or runtime error.
**Fix:**
```javascript
const totalStatusCounts = useMemo(
  () => statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai,
  [statusCounts]
);
```
Then reference `totalStatusCounts` at all three sites.

### IN-03: `Tabel` numeric column key collision risk between `Volume TBS` data and string-coercion sort is unguarded by this file but worth noting

**File:** `src/pages/Laporan.jsx:371, 380`
**Issue:** Both `tableRowsManajer.volume` and `tableRowsTimLogistik.volume` store the pre-formatted string from `formatTonase()` (e.g. `"120 ton"`) rather than the raw numeric `volume_tbs`. `Tabel`'s numeric sort comparator (`src/components/Tabel.jsx:26-29`) strips non-digit characters via regex before parsing, which happens to work correctly for `"120 ton"` strings, but this is an implicit dependency on `Tabel`'s strip-and-parse behavior rather than passing a sortable raw value. This is pre-existing behavior unchanged by this phase (same pattern was already used for `tableRows` before the role split), so it is not a regression — flagged only as a latent fragility now duplicated into two table-row builders instead of one.
**Fix:** No action required for this phase; consider passing `volume_tbs` as a raw number alongside the formatted display string in a future cleanup, e.g. `volume: { value: item.volume_tbs, display: formatTonase(item.volume_tbs) }`, if `Tabel` is ever extended to support a dedicated sort-value field.

---

_Reviewed: 2026-06-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
