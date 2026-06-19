import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Tabel from "../components/Tabel";
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

const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatterAngka = new Intl.NumberFormat("id-ID");

const formatDate = (value) => formatterTanggal.format(parseDate(value));
const formatTonase = (value) => `${formatterAngka.format(value)} ton`;

const roleOptions = ["Manajer Distribusi", "Tim Logistik"];

const periodeOptions = [
  ["minggu-ini", "Minggu ini"],
  ["bulan-ini", "Bulan ini"],
];

function SectionHeader({ children }) {
  return (
    <p
      style={{
        margin: 0,
        marginBottom: "var(--space-3)",
        paddingBottom: "var(--space-3)",
        borderBottom: "1px solid var(--color-border)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wider)",
      }}
    >
      {children}
    </p>
  );
}

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

  const tableRows = filteredRiwayat.map((item) => ({
    id: item.id,
    tanggal: formatDate(item.tanggal_keputusan),
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    diputuskanOleh: item.diputuskan_oleh,
    status: <Badge status={item.status} />,
  }));

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

  const noData =
    filteredRiwayat.length === 0 && chartConfig.labels.length === 0;

  return (
    <Layout
      title="Switera"
      roleAwal={roleAktif}
      menuAwal="laporan"
      onMenuChange={onNavigate}
    >
      <PageHeader
        judul="Laporan Distribusi"
        deskripsi="Riwayat keputusan bersifat permanen dan tetap tersedia untuk audit periode sebelumnya."
        aksi={<PeriodePills value={periode} onChange={setPeriode} />}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {noData ? (
          <EmptyState pesan="Tidak ada data pada periode yang dipilih." />
        ) : (
          <>
            {filteredRiwayat.length > 0 ? (
              <Card>
                <SectionHeader>Riwayat Keputusan</SectionHeader>
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Seluruh keputusan yang pernah dibuat, termasuk yang dibatalkan, tetap ditampilkan pada laporan.
                </p>

                <Tabel
                  kolom={[
                    { key: "tanggal", label: "Tanggal" },
                    { key: "kotaTujuan", label: "Kota Tujuan" },
                    { key: "volume", label: "Volume TBS", numeric: true },
                    { key: "diputuskanOleh", label: "Diputuskan Oleh" },
                    { key: "status", label: "Status" },
                  ]}
                  data={tableRows}
                />
              </Card>
            ) : (
              <EmptyState pesan="Belum ada riwayat keputusan pada periode yang dipilih." />
            )}

            {chartConfig.labels.length > 0 && chartConfig.datasets.length > 0 ? (
              <GrafikTrenPermintaan
                labels={chartConfig.labels}
                datasets={chartConfig.datasets}
              />
            ) : (
              <EmptyState pesan="Belum ada data tren permintaan pada periode yang dipilih." />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Laporan;
