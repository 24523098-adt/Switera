# Phase 2: Role-Differentiated Reporting — Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 1 modified file
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/Laporan.jsx` | page | CRUD + request-response | Self (current) + `StatusDistribusi.jsx` + `AnalisisRanking.jsx` | exact-role, partial-refactor |

---

## Pattern Assignments

### `src/pages/Laporan.jsx` (page, CRUD + request-response)

**Primary Analogs:** 
- `src/pages/Laporan.jsx` (current implementation — structural foundation)
- `src/pages/StatusDistribusi.jsx` (Tim Logistik table pattern with armada/eta columns)
- `src/pages/AnalisisRanking.jsx` (chart component pattern and useMemo filtering)

---

#### 1. Imports Pattern (current Laporan.jsx, lines 1–25)

```javascript
import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { SkeletonChart } from "../components/Skeleton";
import store from "../store";
import {
  CHART_PALETTE,
  chartGridDefaults,
  chartLegendDefaults,
  chartTickDefaults,
  chartTooltipDefaults,
  withOpacity,
} from "../utils/chartDefaults";
import {
  getPeriodRange,
  isDateInRange,
  parseDate,
} from "../utils/distribusi";
import { downloadCsv } from "../utils/csv";
import { formatDate, formatTonase } from "../utils/format";
```

**Pattern:** All imports are relative paths; no path aliases. Design components imported from `../components/`, utilities from `../utils/`. Store imported as default. Chart utilities extracted from centralized `chartDefaults`.

---

#### 2. Subscription & Store Access Pattern (current Laporan.jsx, lines 199–213)

```javascript
function Laporan({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  const [periode, setPeriode] = useState("minggu-ini");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const roleAktif = roleOptions.includes(snapshot.roleAktif)
    ? snapshot.roleAktif
    : "Manajer Distribusi";
```

**Pattern:** 
- Component receives store state via `store.getState()` on mount.
- Subscribes via `store.subscribe()` with cleanup in `useEffect` return.
- Validates `roleAktif` against allowed options, defaults to "Manajer Distribusi".
- Period state managed locally as string (e.g., "minggu-ini").

**Key Decision:** `roleAktif` validation ensures graceful fallback; if role is neither "Manajer Distribusi" nor "Tim Logistik", default is "Manajer Distribusi".

---

#### 3. Data Filtering Pattern (current Laporan.jsx, lines 215–267)

```javascript
const range = useMemo(() => getPeriodRange(periode), [periode]);

const filteredRiwayat = useMemo(
  () =>
    [...(snapshot.riwayatKeputusan ?? [])]
      .filter((item) => isDateInRange(item.tanggal_keputusan, range))
      .sort(
        (first, second) =>
          parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
      ),
  [range, snapshot.riwayatKeputusan]
);

const filteredPermintaan = useMemo(
  () =>
    (snapshot.permintaan ?? []).filter((item) =>
      isDateInRange(item.tanggal_permintaan, range)
    ),
  [range, snapshot.permintaan]
);

const chartConfig = useMemo(() => {
  const labels = [...new Set(filteredPermintaan.map((item) => item.tanggal_permintaan))]
    .sort((first, second) => parseDate(first) - parseDate(second));

  const cityMap = filteredPermintaan.reduce((result, item) => {
    const current = result.get(item.kota) ?? {};
    current[item.tanggal_permintaan] =
      (current[item.tanggal_permintaan] ?? 0) +
      (Number(item.jumlah_permintaan) || 0);
    result.set(item.kota, current);
    return result;
  }, new Map());

  const datasets = [...cityMap.entries()].map(([kota, values]) => ({
    label: kota,
    data: labels.map((label) => values[label] ?? 0),
  }));

  return {
    labels: labels.map((label) => formatDate(label)),
    datasets,
  };
}, [filteredPermintaan]);
```

**Pattern:**
- Period range computed via `getPeriodRange()` utility.
- Each data array copied with spread (`[...(snapshot.X ?? [])]`) to avoid mutations.
- Filters applied via `.filter()` + helpers (e.g., `isDateInRange`).
- Sorting applied after filtering (most recent first via `parseDate` comparison).
- Chart config aggregated via `reduce()` into Map, then converted to datasets array.
- All data transformations wrapped in `useMemo` with correct dependencies.

**For Phase 2 Refactor:** Role-conditional data selection required — for Tim Logistik, add `filteredKeputusan` computed similarly to `filteredRiwayat` but from `snapshot.keputusan`.

---

#### 4. Table Row Transformation (current Laporan.jsx, lines 236–243)

```javascript
const tableRows = filteredRiwayat.map((item) => ({
  id: item.id,
  tanggal: formatDate(item.tanggal_keputusan),
  kotaTujuan: item.kota_tujuan,
  volume: formatTonase(item.volume_tbs),
  diputuskanOleh: item.diputuskan_oleh,
  status: <Badge status={item.status} />,
}));
```

**Pattern:**
- Each row object has `id` as immutable key.
- Dates formatted via `formatDate()`, numbers via `formatTonase()`.
- Status rendered as JSX component (`<Badge />`).
- Row keys match Tabel column `key` props exactly.

**Analog Reference (Tim Logistik pattern):** From `StatusDistribusi.jsx` lines 57–64:
```javascript
const rows = keputusanAktif.map((item) => ({
  id: item.id,
  kotaTujuan: item.kota_tujuan,
  volume: formatTonase(item.volume_tbs),
  armada: item.armada ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}` : "-",
  tanggalKeputusan: formatDate(item.tanggal_keputusan),
  status: <Badge status={item.status} />,
}));
```

**Key Difference:** Tim Logistik adds `armada` field (concatenated string with ETA if present).

---

#### 5. CSV Export Pattern (current Laporan.jsx, lines 272–282)

```javascript
const handleExportCsv = () => {
  const rows = filteredRiwayat.map((item) => ({
    tanggal: item.tanggal_keputusan,
    kota_tujuan: item.kota_tujuan,
    volume_tbs: item.volume_tbs,
    diputuskan_oleh: item.diputuskan_oleh,
    status: item.status,
  }));

  downloadCsv(`laporan-distribusi-${periode}.csv`, rows);
};
```

**Pattern:**
- Export handler maps filtered data to CSV-ready format (uses raw field names, not JSX components).
- Filename includes `periode` slug (e.g., "minggu-ini", "bulan-ini").
- Uses `downloadCsv()` utility from `src/utils/csv.js` (lines 80–105):
  ```javascript
  export const downloadCsv = (filename, rows, columns) => {
    if (!rows || rows.length === 0) {
      return;
    }
    // Rows: array of objects with keys matching column definitions
    // Returns CSV with BOM, auto-downloads to user's Downloads folder
  };
  ```

**For Phase 2 Refactor:** 
- Manajer Distribusi: export same columns as current (tanggal, kota_tujuan, volume_tbs, diputuskan_oleh, status).
- Tim Logistik: export additional columns (armada, eta) — filename changes to `laporan-status-${periode}.csv`.

---

#### 6. No-Data State Logic (current Laporan.jsx, lines 269–350)

```javascript
const noData =
  filteredRiwayat.length === 0 && chartConfig.labels.length === 0;

// Render:
{noData ? (
  <EmptyState pesan="Tidak ada data pada periode yang dipilih." />
) : (
  <>
    {filteredRiwayat.length > 0 ? (
      <Card>
        <SectionHeader>Riwayat Keputusan</SectionHeader>
        <p style={{ /* description text */ }}>
          Seluruh keputusan yang pernah dibuat, termasuk yang dibatalkan, tetap ditampilkan pada laporan.
        </p>
        <Tabel ... />
      </Card>
    ) : (
      <EmptyState pesan="Belum ada riwayat keputusan pada periode yang dipilih." />
    )}

    {chartConfig.labels.length > 0 && chartConfig.datasets.length > 0 ? (
      <GrafikTrenPermintaan ... />
    ) : (
      <EmptyState pesan="Belum ada data tren permintaan pada periode yang dipilih." />
    )}
  </>
)}
```

**Pattern:**
- Top-level `noData` check shows full-page empty state if all data sources empty.
- Sections render independently; each section can be empty while others have data.
- Section-level empty states use specific copy (e.g., "Belum ada riwayat keputusan...").

**For Phase 2 Refactor:**
- Role determines which empty-state messages and section titles appear.
- Manajer Distribusi: shows "Riwayat Keputusan" + "Tren Permintaan per Kota".
- Tim Logistik: shows "Distribusi Aktif" + "Status Pengiriman" (new chart).

---

#### 7. Chart Component Pattern (current Laporan.jsx, lines 77–197, `GrafikTrenPermintaan`)

```javascript
function GrafikTrenPermintaan({ datasets, labels }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (
      !canvasRef.current ||
      labels.length === 0 ||
      datasets.length === 0 ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    setIsChartReady(false);
    let chartInstance;
    let isActive = true;

    import("chart.js/auto")
      .then((module) => {
        if (!isActive || !canvasRef.current) {
          return;
        }

        const Chart = module.default;
        const ctx = canvasRef.current.getContext("2d");

        chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: datasets.map((dataset, index) => {
              const color = CHART_PALETTE[index % CHART_PALETTE.length];
              return {
                label: dataset.label,
                data: dataset.data,
                borderColor: color,
                backgroundColor: withOpacity(color, 0.7),
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
              };
            }),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                ...chartLegendDefaults,
              },
              tooltip: {
                ...chartTooltipDefaults,
                callbacks: {
                  label(context) {
                    return `${context.dataset.label}: ${formatTonase(context.parsed.y)}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { ...chartTickDefaults },
              },
              y: {
                beginAtZero: true,
                grid: { ...chartGridDefaults },
                ticks: {
                  ...chartTickDefaults,
                  callback(value) {
                    return formatTonase(value);
                  },
                },
              },
            },
          },
        });

        setChartError("");
        setIsChartReady(true);
      })
      .catch(() => {
        if (isActive) {
          setChartError("Grafik tidak dapat dimuat karena Chart.js belum tersedia.");
        }
      });

    return () => {
      isActive = false;
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [datasets, labels]);

  return (
    <Card style={{ minHeight: "420px" }}>
      <SectionHeader>Tren Permintaan per Kota</SectionHeader>

      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "320px" }}>
          {isChartReady ? null : <SkeletonChart height="320px" />}
          <canvas
            ref={canvasRef}
            aria-label="Grafik tren permintaan per kota"
            style={{
              display: isChartReady ? "block" : "none",
              animation: "fadeInUp 300ms var(--ease-smooth) both",
            }}
          />
        </div>
      )}
    </Card>
  );
}
```

**Pattern:**
- Functional component accepts `datasets` and `labels` props (already computed by parent).
- Uses `useRef` for canvas element, `useState` for error/readiness state.
- Chart.js imported dynamically via `import("chart.js/auto")`.
- `isActive` flag prevents state updates on unmounted component.
- Cleanup function in `useEffect` return destroys chart instance.
- Chart config uses palette from `chartDefaults.js` (colors, grid, legend, tooltip defaults).
- Loading state shows `<SkeletonChart />`, error state shows `<EmptyState />`.
- Canvas hidden until `isChartReady` true; fade-in animation applied.

**For Phase 2 Refactor:** Tim Logistik needs a new chart component (e.g., `GrafikStatusPengiriman`) using similar pattern but with:
- Chart type: "doughnut" or "bar" (executor choice based on clarity).
- Data: `status` counts (menunggu, dalam-pengiriman, selesai).
- Labels: Status labels from `statusLabels` map (same as StatusDistribusi.jsx lines 16–20).

---

#### 8. Page Header & Controls Pattern (current Laporan.jsx, lines 284–300)

```javascript
<>
  <PageHeader
    judul="Laporan Distribusi"
    deskripsi="Riwayat keputusan bersifat permanen dan tetap tersedia untuk audit periode sebelumnya."
    aksi={
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <PeriodePills value={periode} onChange={setPeriode} />
        <Tombol
          label="Ekspor CSV"
          variant="sekunder"
          onClick={handleExportCsv}
          disabled={filteredRiwayat.length === 0}
        />
      </div>
    }
  />
```

**Pattern:**
- `PageHeader` accepts `judul` (page title), `deskripsi`, and `aksi` (action controls).
- Period pills are inline control (custom component or styled div).
- CSV export button disabled when table data empty.
- Flex layout with wrapping for responsive behavior on small screens.

**For Phase 2 Refactor:** `judul` and `deskripsi` change based on role (data in UI-SPEC.md).

---

#### 9. PeriodePills Component (current Laporan.jsx, lines 34–75)

```javascript
const periodeOptions = [
  ["minggu-ini", "Minggu ini"],
  ["bulan-ini", "Bulan ini"],
];

function PeriodePills({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "3px",
      }}
    >
      {periodeOptions.map(([key, label]) => {
        const active = key === value;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-2xs)",
              fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
              color: active ? "#fff" : "var(--color-text-muted)",
              backgroundColor: active ? "var(--color-primary)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
              transition: "all var(--transition-fast)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

**Pattern:**
- Locally scoped `periodeOptions` constant at module level.
- Component is reusable; receives current `value` and `onChange` callback.
- Active state toggled via CSS (backgroundColor, color, fontWeight, boxShadow).
- Transitions applied for smooth visual feedback.
- No local state; purely controlled by parent.

---

## Shared Patterns

### Store Subscription (applies to all pages)

**Source:** `src/pages/Laporan.jsx` (lines 200–209)

Pattern: Every page subscribes to `store` on mount and unsubscribes on unmount. Do not manually call `store.getState()` repeatedly; subscribe once and update local state.

```javascript
const [snapshot, setSnapshot] = useState(store.getState());

useEffect(() => {
  const unsubscribe = store.subscribe((nextSnapshot) => {
    setSnapshot(nextSnapshot);
  });
  return unsubscribe;
}, []);
```

---

### Role-Based Validation with Fallback

**Source:** `src/pages/Laporan.jsx` (lines 211–213)

Pattern: When using `roleAktif`, validate against a whitelist and provide a safe default.

```javascript
const roleAktif = roleOptions.includes(snapshot.roleAktif)
  ? snapshot.roleAktif
  : "Manajer Distribusi";
```

**Apply to:** Laporan.jsx role-conditional rendering. If role is neither "Manajer Distribusi" nor "Tim Logistik", default to "Manajer Distribusi" (safest path).

---

### Responsive Flex Layout (applies to all action bars)

**Source:** `src/pages/Laporan.jsx` (lines 289–298)

Pattern: Use `display: flex` with `alignItems: "center"`, `gap: "var(--space-3)"`, and `flexWrap: "wrap"` for responsive control grouping.

```javascript
<div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
  {/* Controls */}
</div>
```

---

### Data Filtering with useMemo

**Source:** `src/pages/Laporan.jsx` (lines 215–267)

Pattern: Wrap all derived data in `useMemo` with explicit dependencies. Copy arrays before mutating (spread `[...]` or `.slice()`).

```javascript
const filteredData = useMemo(
  () =>
    [...(snapshot.data ?? [])]
      .filter(condition)
      .sort(compareFn),
  [dependency1, dependency2]
);
```

**Apply to:** All role-conditional filtering in Laporan.jsx. For Tim Logistik, compute `filteredKeputusan` similarly to `filteredRiwayat`.

---

### CSV Export with Filename Slug

**Source:** `src/utils/csv.js` (lines 80–105) + `src/pages/Laporan.jsx` (lines 272–282)

Pattern: Map filtered data to plain objects (no JSX), pass to `downloadCsv(filename, rows)`. Filename includes periodo slug.

```javascript
const handleExportCsv = () => {
  const rows = filteredData.map((item) => ({
    field1: item.field1,
    field2: item.field2,
  }));
  downloadCsv(`report-${periode}.csv`, rows);
};
```

**Apply to:** Both roles in Laporan.jsx. Manajer Distribusi uses current columns; Tim Logistik adds armada + eta, changes filename to `laporan-status-${periode}.csv`.

---

### Chart Component Setup (applies to all charts)

**Source:** `src/pages/Laporan.jsx` (lines 77–197) + `src/pages/AnalisisRanking.jsx` (lines 35–172)

Pattern:
1. Functional component receives pre-computed `datasets` and `labels` props.
2. Uses `useRef` for canvas, `useState` for error/readiness.
3. Dynamic `import("chart.js/auto")` + `isActive` flag to prevent unmounted updates.
4. Cleanup in `useEffect` return destroys chart instance.
5. Skeleton loader while rendering, error state for failures.

```javascript
function ChartComponent({ datasets, labels }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !datasets.length || !labels.length) return;
    setIsChartReady(false);
    let chartInstance;
    let isActive = true;

    import("chart.js/auto")
      .then((module) => {
        if (!isActive) return;
        // ... chart init
        setIsChartReady(true);
      })
      .catch(() => {
        if (isActive) setChartError("Error message");
      });

    return () => {
      isActive = false;
      chartInstance?.destroy();
    };
  }, [datasets, labels]);

  return (
    <Card>
      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "320px" }}>
          {!isChartReady && <SkeletonChart height="320px" />}
          <canvas ref={canvasRef} style={{ display: isChartReady ? "block" : "none" }} />
        </div>
      )}
    </Card>
  );
}
```

**Apply to:** `GrafikTrenPermintaan` (unchanged) + new `GrafikStatusPengiriman` for Tim Logistik (doughnut or bar chart).

---

## Specific Implementation Guidance for Phase 2

### Manajer Distribusi Branch

**Data sources:**
- Table: `filteredRiwayat` (snapshot.riwayatKeputusan)
- Chart: `filteredPermintaan` (snapshot.permintaan)

**Sections:**
1. **Riwayat Keputusan** — use existing table structure (current).
2. **Tren Permintaan per Kota** — use existing `GrafikTrenPermintaan` (current).

**Page heading:** "Laporan Distribusi"  
**Page description:** "Riwayat keputusan bersifat permanen dan tetap tersedia untuk audit periode sebelumnya."  
**CSV filename:** `laporan-distribusi-${periode}.csv`  
**CSV columns:** tanggal, kota_tujuan, volume_tbs, diputuskan_oleh, status

---

### Tim Logistik Branch

**Data sources:**
- Table: `filteredKeputusan` (snapshot.keputusan — NEW useMemo needed)
- Chart: Status counts (NEW chart component needed)

**Sections:**
1. **Distribusi Aktif** — similar to Manajer table but:
   - Data source: `snapshot.keputusan` (not riwayatKeputusan)
   - Columns: tanggal, kota_tujuan, volume, **armada + ETA** (from StatusDistribusi.jsx pattern), status
   - Description: "Seluruh distribusi dengan detail armada dan status pengiriman untuk audit periode sebelumnya."

2. **Status Pengiriman** — NEW chart:
   - Chart type: doughnut or bar (executor chooses)
   - Data: Count keputusan by `status` field (menunggu, dalam-pengiriman, selesai)
   - Use status labels from `statusLabels` (from StatusDistribusi.jsx lines 16–20)
   - Same chart setup pattern as `GrafikTrenPermintaan`

**Page heading:** "Laporan Status Distribusi"  
**Page description:** "Pantau progres distribusi aktif dan riwayat pengiriman per periode."  
**CSV filename:** `laporan-status-${periode}.csv`  
**CSV columns:** tanggal, kota_tujuan, volume_tbs, armada, eta, status

---

## No Analog Found

None — all required patterns exist in codebase.

---

## Metadata

**Analog search scope:** `src/pages/` (12 page files), `src/utils/` (7 utility files), `src/components/` (18 component files)

**Files scanned:** 37 total

**Pattern extraction date:** 2026-06-24

**Key dependencies identified:**
- `store.subscribe()` → pub/sub pattern established
- `formatDate()`, `formatTonase()` → formatting utilities ready
- `downloadCsv()` → CSV export ready
- `chartDefaults.js` → chart theme consistent
- `StatusDistribusi.jsx` → Tim Logistik data patterns available
- `AnalisisRanking.jsx` → chart component patterns available
