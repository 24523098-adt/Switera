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

const roleOptions = ["Manajer Distribusi", "Tim Logistik"];

const periodeOptions = [
  ["minggu-ini", "Minggu ini"],
  ["bulan-ini", "Bulan ini"],
];

const statusLabels = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};

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

function GrafikStatusPengiriman({ counts }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  const total = counts.menunggu + counts["dalam-pengiriman"] + counts.selesai;

  useEffect(() => {
    if (!canvasRef.current || total === 0 || typeof window === "undefined") {
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
          type: "doughnut",
          data: {
            labels: [
              statusLabels.menunggu,
              statusLabels["dalam-pengiriman"],
              statusLabels.selesai,
            ],
            datasets: [
              {
                data: [counts.menunggu, counts["dalam-pengiriman"], counts.selesai],
                backgroundColor: [
                  withOpacity(CHART_PALETTE[0], 0.7),
                  withOpacity(CHART_PALETTE[1], 0.7),
                  withOpacity(CHART_PALETTE[2], 0.7),
                ],
                borderColor: [CHART_PALETTE[0], CHART_PALETTE[1], CHART_PALETTE[2]],
                borderWidth: 2,
              },
            ],
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
              },
            },
            cutout: "60%",
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
  }, [counts, total]);

  return (
    <Card style={{ minHeight: "420px" }}>
      <SectionHeader>Status Pengiriman</SectionHeader>

      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "320px" }}>
          {isChartReady ? null : <SkeletonChart height="320px" />}
          <canvas
            ref={canvasRef}
            aria-label="Grafik status pengiriman"
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

  const isTimLogistik = roleAktif === "Tim Logistik";

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

  const filteredKeputusan = useMemo(
    () =>
      [...(snapshot.keputusan ?? [])]
        .filter((item) => isDateInRange(item.tanggal_keputusan, range))
        .sort(
          (first, second) =>
            parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
        ),
    [range, snapshot.keputusan]
  );

  const statusCounts = useMemo(() => {
    const counts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
    filteredKeputusan.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });
    return counts;
  }, [filteredKeputusan]);

  const tableRowsManajer = filteredRiwayat.map((item) => ({
    id: item.id,
    tanggal: formatDate(item.tanggal_keputusan),
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    diputuskanOleh: item.diputuskan_oleh,
    status: <Badge status={item.status} />,
  }));

  const tableRowsTimLogistik = filteredKeputusan.map((item) => ({
    id: item.id,
    tanggal: formatDate(item.tanggal_keputusan),
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    armada: item.armada
      ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}`
      : "-",
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

  const noData = isTimLogistik
    ? filteredKeputusan.length === 0 &&
      statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai === 0
    : filteredRiwayat.length === 0 && chartConfig.labels.length === 0;

  const handleExportCsv = () => {
    if (isTimLogistik) {
      const rows = filteredKeputusan.map((item) => ({
        tanggal: item.tanggal_keputusan,
        kota_tujuan: item.kota_tujuan,
        volume_tbs: item.volume_tbs,
        armada: item.armada ?? "",
        eta: item.eta ?? "",
        status: item.status,
      }));

      downloadCsv(`laporan-status-${periode}.csv`, rows);
      return;
    }

    const rows = filteredRiwayat.map((item) => ({
      tanggal: item.tanggal_keputusan,
      kota_tujuan: item.kota_tujuan,
      volume_tbs: item.volume_tbs,
      diputuskan_oleh: item.diputuskan_oleh,
      status: item.status,
    }));

    downloadCsv(`laporan-distribusi-${periode}.csv`, rows);
  };

  return (
    <>
      <PageHeader
        judul={isTimLogistik ? "Laporan Status Distribusi" : "Laporan Distribusi"}
        deskripsi={
          isTimLogistik
            ? "Pantau progres distribusi aktif dan riwayat pengiriman per periode."
            : "Riwayat keputusan bersifat permanen dan tetap tersedia untuk audit periode sebelumnya."
        }
        aksi={
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <PeriodePills value={periode} onChange={setPeriode} />
            <Tombol
              label="Ekspor CSV"
              variant="sekunder"
              onClick={handleExportCsv}
              disabled={isTimLogistik ? filteredKeputusan.length === 0 : filteredRiwayat.length === 0}
            />
          </div>
        }
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
        ) : isTimLogistik ? (
          <>
            {filteredKeputusan.length > 0 ? (
              <Card>
                <SectionHeader>Distribusi Aktif</SectionHeader>
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Seluruh distribusi dengan detail armada dan status pengiriman untuk audit periode sebelumnya.
                </p>

                <Tabel
                  kolom={[
                    { key: "tanggal", label: "Tanggal" },
                    { key: "kotaTujuan", label: "Kota Tujuan" },
                    { key: "volume", label: "Volume TBS", numeric: true },
                    { key: "armada", label: "Armada / ETA" },
                    { key: "status", label: "Status" },
                  ]}
                  data={tableRowsTimLogistik}
                />
              </Card>
            ) : (
              <EmptyState pesan="Belum ada distribusi aktif pada periode yang dipilih." />
            )}

            {statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai > 0 ? (
              <GrafikStatusPengiriman counts={statusCounts} />
            ) : (
              <EmptyState pesan="Belum ada data status distribusi pada periode yang dipilih." />
            )}
          </>
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
                  data={tableRowsManajer}
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
    </>
  );
}

export default Laporan;
