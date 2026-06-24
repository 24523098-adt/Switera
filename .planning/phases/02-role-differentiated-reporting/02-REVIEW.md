---
phase: 02-role-differentiated-reporting
reviewed: 2026-06-24T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/pages/Laporan.jsx
findings:
  critical: 0
  warning: 0
  info: 4
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-24
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

This is a re-review of `src/pages/Laporan.jsx` following a prior review iteration (`02-REVIEW.iter2.md`) and fix iteration (`02-REVIEW-FIX.iter2.md`). The previously identified Warning (`WR-01`, undocumented invariant in `statusCounts`) was fixed with an inline comment at lines 360-362 and is confirmed resolved here — the comment accurately documents that `removeKeputusan()` (`src/store.js:472-483`) strips `dibatalkan` entries out of `state.keputusan` before they ever reach this counter, and that invariant was independently re-verified against the current store implementation (`addKeputusan`, `updateKeputusan`, `removeKeputusan`, `restoreKeputusan` all read).

This pass cross-checked the file against `src/store.js`, `src/utils/distribusi.js` (`getPeriodRange`, `isDateInRange`, `parseDate`), `src/utils/csv.js` (`downloadCsv`), `src/utils/format.js` (`formatDate`, `formatTonase`), `src/components/Tabel.jsx`, `src/components/Badge.jsx`, and `src/utils/navigation.js` (role/menu gating, confirming `Admin` never reaches this page and the file's local `roleOptions` allowlist is intentional). No new critical or warning-level defects were found — no security issues, crashes, or data-loss risks identified. The three previously-filed Info items (`IN-01`, `IN-02`, `IN-03`) remain present in the code unchanged (they were explicitly out of scope for the prior fix pass, which only applied `critical_warning` scope) and are restated below, along with one newly observed Info-level redundancy (`IN-04`).

## Info

### IN-01: `GrafikStatusPengiriman` recomputes `total` outside the memoized counts on every render

**File:** `src/pages/Laporan.jsx:210`
**Issue:** `const total = counts.menunggu + counts["dalam-pengiriman"] + counts.selesai;` runs on every render of `GrafikStatusPengiriman`, recomputing a value that is fully derivable from the already-memoized `counts` prop. This duplicates the same three-key sum computed independently at the call sites (`Laporan.jsx:414-416` and `:506`). Still present, unresolved from the prior review (previously info-tier, out of fix scope).
**Fix:** Compute the total once where `statusCounts` is built and pass/reuse it everywhere, e.g. via a small `getStatusTotal(counts)` helper next to `statusLabels`.

### IN-02: Magic three-key status sum repeated three times

**File:** `src/pages/Laporan.jsx:210, 414-416, 506`
**Issue:** The expression `counts.menunggu + counts["dalam-pengiriman"] + counts.selesai` (or its `statusCounts.*` equivalent) is duplicated verbatim in three locations: inside `GrafikStatusPengiriman`, inside the `noData` ternary, and inside the JSX render gate for the chart/empty-state branch. A future status addition requires updating all three call sites in lockstep; missing one would silently break only one of the three behaviors without a build or runtime error. Still present, unresolved from the prior review.
**Fix:**
```javascript
const totalStatusCounts = useMemo(
  () => statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai,
  [statusCounts]
);
```
Then reference `totalStatusCounts` at all three sites.

### IN-03: `Tabel` numeric column sort relies on string-coercion of pre-formatted `volume` values

**File:** `src/pages/Laporan.jsx:373, 383`
**Issue:** Both `tableRowsManajer.volume` and `tableRowsTimLogistik.volume` store the pre-formatted string from `formatTonase()` (e.g. `"120 ton"`) rather than the raw numeric `volume_tbs`. `Tabel`'s numeric sort comparator (`src/components/Tabel.jsx:27`) strips non-digit/dot/minus characters via `replace(/[^\d.-]/g, "")` then `parseFloat`. This works for values under 1000, but `formatTonase` uses `Intl.NumberFormat("id-ID")`, which renders thousands using `.` as the grouping separator (verified: `formatTonase(1234)` → `"1.234 ton"`). After strip-and-parse, `"1.234"` parses to `1.234`, not `1234`, so any volume ≥ 1000 ton would sort incorrectly relative to smaller volumes in this column. This is pre-existing behavior unchanged by this phase (the same `Tabel` numeric-sort contract is used elsewhere in the app), not a regression introduced here, but it is now duplicated into two table-row builders in this file instead of one and remains a real correctness risk if any city's volume crosses the 1000-ton threshold.
**Fix:** No action strictly required for this phase scope, but consider passing a dedicated sort value alongside the display string if `Tabel` is ever extended to support it, e.g. `volume: { value: item.volume_tbs, display: formatTonase(item.volume_tbs) }`, or have `Tabel` accept a raw `sortValue` per cell to avoid string-strip parsing entirely.

### IN-04: Redundant second clause in Tim Logistik `noData` condition

**File:** `src/pages/Laporan.jsx:417-419`
**Issue:** `noData` for the Tim Logistik branch is computed as `filteredKeputusan.length === 0 && statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai === 0`. Since `statusCounts` is derived exclusively from `filteredKeputusan` (lines 357-368), an empty `filteredKeputusan` array necessarily produces a zero sum in `statusCounts` — the second clause is always `true` whenever the first clause is `true`, making it dead/redundant logic that adds no information and slightly obscures intent.
**Fix:** Simplify to a single check on the source array:
```javascript
const noData = isTimLogistik
  ? filteredKeputusan.length === 0
  : filteredRiwayat.length === 0 && chartConfig.labels.length === 0;
```

---

_Reviewed: 2026-06-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
