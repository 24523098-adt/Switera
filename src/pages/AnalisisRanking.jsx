import { useEffect, useMemo, useRef, useState } from "react";
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
  chartTickDefaults,
  chartTooltipDefaults,
  withOpacity,
} from "../utils/chartDefaults";
import { aggregatePermintaanRanking } from "../utils/distribusi";

const formatterAngka = new Intl.NumberFormat("id-ID");
const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatTonase = (value) => `${formatterAngka.format(value)} ton`;
const formatDate = (value) =>
  value ? formatterTanggal.format(new Date(`${value}T00:00:00`)) : "-";

const getRankColor = (rank) => {
  if (rank === 1) {
    return { backgroundColor: "var(--color-accent-subtle)", color: "var(--color-accent)" };
  }

  if (rank === 2) {
    return { backgroundColor: "rgba(156,163,175,0.12)", color: "#9ca3af" };
  }

  if (rank === 3) {
    return { backgroundColor: "rgba(184,115,51,0.12)", color: "#b87333" };
  }

  return { backgroundColor: "var(--color-surface-2)", color: "var(--color-text-secondary)" };
};

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

function GrafikRankingHorizontal({ ranking }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || ranking.length === 0 || typeof window === "undefined") {
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
        const colors = ranking.map((_item, index) => CHART_PALETTE[index % CHART_PALETTE.length]);

        chartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ranking.map((item) => item.kota),
            datasets: [
              {
                data: ranking.map((item) => item.totalPermintaan),
                backgroundColor: colors.map((color) => withOpacity(color, 0.7)),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 10,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 900,
              easing: "easeOutQuart",
              delay(context) {
                return context.dataIndex * 80;
              },
            },
            animations: {
              x: {
                from: 0,
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                ...chartTooltipDefaults,
                callbacks: {
                  label(context) {
                    return formatTonase(context.parsed.x);
                  },
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { ...chartGridDefaults },
                ticks: {
                  ...chartTickDefaults,
                  callback(value) {
                    return formatTonase(value);
                  },
                },
              },
              y: {
                grid: { display: false },
                ticks: { ...chartTickDefaults },
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
  }, [ranking]);

  return (
    <Card style={{ minHeight: "420px" }}>
      <SectionHeader>Grafik Ranking Permintaan</SectionHeader>

      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "320px" }}>
          {isChartReady ? null : <SkeletonChart height="320px" />}
          <canvas
            ref={canvasRef}
            aria-label="Grafik ranking permintaan kota"
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

function AnalisisRanking({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const ranking = useMemo(
    () => aggregatePermintaanRanking(snapshot.permintaan ?? []),
    [snapshot.permintaan]
  );
  const periodeData = useMemo(() => {
    const dates = (snapshot.permintaan ?? [])
      .map((item) => item.tanggal_permintaan)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) {
      return "Belum ada periode data";
    }

    return `${formatDate(dates[0])} sampai ${formatDate(dates[dates.length - 1])}`;
  }, [snapshot.permintaan]);

  const topValue = ranking[0]?.totalPermintaan ?? 0;
  const rows = ranking.map((item, index) => ({
    id: item.kota,
    peringkat: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          minWidth: "34px",
          height: "28px",
          padding: "0 8px",
          borderRadius: "var(--radius-full)",
          fontWeight: 700,
          ...getRankColor(index + 1),
        }}
      >
        {index === 0 ? "🏆 " : ""}
        {index + 1}
      </span>
    ),
    namaKota: item.kota,
    totalPermintaan: formatTonase(item.totalPermintaan),
    selisih: (() => {
      const difference = topValue - item.totalPermintaan;
      const color =
        difference > 100 ? "var(--color-danger)" : "var(--color-success)";

      return (
        <span
          style={{
            color: index === 0 ? "var(--color-text-secondary)" : color,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
          }}
        >
          {index === 0 ? "0 ton" : formatTonase(difference)}
        </span>
      );
    })(),
  }));

  return (
    <Layout
      title="Switera"
      roleAwal="Manajer Distribusi"
      menuAwal="analisis-ranking"
      onMenuChange={onNavigate}
    >
      <PageHeader
        judul="Analisis Ranking Permintaan"
        deskripsi={`Periode data: ${periodeData}`}
      />
      {ranking.length === 0 ? (
        <EmptyState pesan="Belum ada data permintaan. Silakan hubungi Admin." />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <Card>
            <SectionHeader>Ranking Permintaan Kota</SectionHeader>
            <p
              style={{
                margin: "0 0 1rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                fontSize: "var(--text-sm)",
              }}
            >
              Jika total permintaan sama, kota dengan tanggal input paling awal diprioritaskan lebih tinggi.
            </p>

            <Tabel
              kolom={[
                { key: "peringkat", label: "Peringkat" },
                { key: "namaKota", label: "Nama Kota" },
                { key: "totalPermintaan", label: "Total Permintaan (ton)", numeric: true },
                { key: "selisih", label: "Selisih dari Peringkat 1", numeric: true },
              ]}
              data={rows}
              getRowStyle={(_baris, index) =>
                index === 0 ? { backgroundColor: "rgba(242,167,27,0.06)" } : undefined
              }
            />
          </Card>

          <GrafikRankingHorizontal ranking={ranking} />
        </div>
      )}
    </Layout>
  );
}

export default AnalisisRanking;
