import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { SkeletonChart } from "../components/Skeleton";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import store from "../store";
import { formatWaktuRelatif } from "../utils/waktu";
import { formatterAngka, formatDate, formatDateSingkat, formatTonase } from "../utils/format";
import {
  CHART_PALETTE,
  chartGridDefaults,
  chartTickDefaults,
  chartTooltipDefaults,
  withOpacity,
} from "../utils/chartDefaults";
import {
  aggregatePermintaanRanking,
  computeKpiMetrics,
  computeRekomendasiDistribusi,
  getDuplicateGroups,
  getLatestKeputusanByKota,
  getLocalDateKey,
  parseDate,
} from "../utils/distribusi";
import { computeForecastPerKota } from "../utils/forecast";

const formatterTanggalHero = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const formatterHari = new Intl.DateTimeFormat("id-ID", { weekday: "long" });
const formatterJam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const getGreeting = (hour) => {
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

const statusOptions = ["menunggu", "dalam-pengiriman", "selesai"];
const statusLabels = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};
const statusUrutan = ["menunggu", "dalam-pengiriman", "selesai"];

function IkonDatabase() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 6V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12C4 13.6569 7.58172 15 12 15C15.866 15 19 13.6569 19 12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IkonKalender() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3V7M16 3V7M3.5 10H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 17L9.5 10.5L13.5 14.5L21 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7H21V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 19 14.5 19 9.5C19 5.35786 15.6421 2 12 2C8.35786 2 5 5.35786 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IkonTruck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 6H13V16H2.5V6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 9.5H17L20.5 13V16H13V9.5Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IkonClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonCheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.5L11 15.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonPlusCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonTableList() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9.5H21M9 9.5V19.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IkonWarningTriangle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 3.5L21.5 20H2.5L12 3.5Z" stroke="var(--color-warning)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10V14.5" stroke="var(--color-warning)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="var(--color-warning)" />
    </svg>
  );
}

function IkonEditKecil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L4.6 16.4L15.5 5.5C16 5 16.7 5 17.2 5.5L18.5 6.8C19 7.3 19 8 18.5 8.5L7.6 19.4L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function HeroStrip({ nama, role }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Card
      style={{
        background: "linear-gradient(135deg, rgba(45,106,79,0.15) 0%, rgba(45,106,79,0.06) 50%, rgba(45,106,79,0.02) 100%)",
        border: "1px solid rgba(45,106,79,0.2)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-5) var(--space-6)",
        minHeight: "80px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--space-3)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-40px",
          top: "-40px",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,106,79,0.2), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          {getGreeting(now.getHours())}
        </p>
        <p
          style={{
            margin: "var(--space-1) 0 0",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text-primary)",
          }}
        >
          {nama ?? "Pengguna"}
        </p>
        {role ? (
          <span
            style={{
              display: "inline-flex",
              marginTop: "var(--space-2)",
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border-mid)",
              borderRadius: "var(--radius-full)",
              padding: "2px 10px",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-secondary)",
            }}
          >
            {role}
          </span>
        ) : null}
      </div>
      <div style={{ position: "relative", textAlign: "right" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-3xl)",
            fontWeight: "var(--font-weight-bold)",
            fontFamily: "var(--font-mono)",
            color: "var(--color-primary)",
            letterSpacing: "3px",
          }}
        >
          {formatterJam.format(now)}
        </p>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {formatterTanggalHero.format(now)}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          {formatterHari.format(now)}
        </p>
      </div>
    </Card>
  );
}

function ActionCard({ ikon, iconColor, judul, sub, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="dashboard-action-card"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onClick?.();
        }
      }}
    >
      <span style={{ display: "flex", color: iconColor, flexShrink: 0 }}>{ikon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
          {judul}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

function GrafikPermintaan({ rankingKota }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || rankingKota.length === 0 || typeof window === "undefined") {
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
        const colors = rankingKota.map((_item, index) => CHART_PALETTE[index % CHART_PALETTE.length]);

        chartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: rankingKota.map((item) => item.kota),
            datasets: [
              {
                label: "Permintaan per Kota",
                data: rankingKota.map((item) => item.totalPermintaan),
                backgroundColor: colors.map((color) => withOpacity(color, 0.7)),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 10,
                maxBarThickness: 48,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...chartTooltipDefaults,
                callbacks: {
                  label(context) {
                    return `${formatterAngka.format(context.parsed.y)} ton`;
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
                    return `${formatterAngka.format(value)} ton`;
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
  }, [rankingKota]);

  return (
    <Card style={{ minHeight: "420px" }}>
      <SectionHeader>Grafik Permintaan per Kota</SectionHeader>

      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "320px" }}>
          {isChartReady ? null : <SkeletonChart height="320px" />}
          <canvas
            ref={canvasRef}
            aria-label="Grafik permintaan per kota"
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

function GrafikMiniPerKota({ rankingKota }) {
  const canvasRef = useRef(null);
  const [chartError, setChartError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);
  const top5 = useMemo(() => rankingKota.slice(0, 5), [rankingKota]);

  useEffect(() => {
    if (!canvasRef.current || top5.length === 0 || typeof window === "undefined") {
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
        const gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width, 0);
        gradient.addColorStop(0, "#2d6a4f");
        gradient.addColorStop(1, "#40916c");

        chartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: top5.map((item) => item.kota),
            datasets: [
              {
                data: top5.map((item) => item.totalPermintaan),
                backgroundColor: gradient,
                borderRadius: 6,
                maxBarThickness: 18,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
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
              x: { display: false, grid: { display: false } },
              y: { grid: { display: false }, ticks: { ...chartTickDefaults } },
            },
          },
        });

        setChartError("");
        setIsChartReady(true);
      })
      .catch(() => {
        if (isActive) {
          setChartError("Grafik tidak dapat dimuat.");
        }
      });

    return () => {
      isActive = false;
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [top5]);

  return (
    <Card>
      <SectionHeader>Permintaan per Kota</SectionHeader>
      {chartError ? (
        <EmptyState pesan={chartError} />
      ) : (
        <div style={{ height: "160px" }}>
          {isChartReady ? null : <SkeletonChart height="160px" />}
          <canvas
            ref={canvasRef}
            aria-label="Grafik mini permintaan per kota"
            style={{ display: isChartReady ? "block" : "none" }}
          />
        </div>
      )}
    </Card>
  );
}

function DashboardAdmin({ permintaan, keputusan, userAktif, onNavigate }) {
  const totalPermintaan = permintaan.length;
  const allDates = permintaan.map((item) => item.tanggal_input).filter(Boolean);
  const latestDate = allDates.sort((first, second) => parseDate(second) - parseDate(first))[0];
  const duplicateGroups = getDuplicateGroups(permintaan);

  const permintaanPerKota = useMemo(() => {
    const counts = new Map();
    permintaan.forEach((item) => {
      counts.set(item.kota, (counts.get(item.kota) ?? 0) + 1);
    });
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .map(([kota, jumlah]) => ({ kota, jumlah, persen: (jumlah / max) * 100 }))
      .sort((first, second) => second.jumlah - first.jumlah)
      .slice(0, 4);
  }, [permintaan]);
  const { ripples, onMouseDown, removeRipple } = useRipple();

  const aktivitasTerbaru = useMemo(() => {
    const dariPermintaan = permintaan
      .filter((item) => item.tanggal_input)
      .map((item) => ({
        id: `p-${item.id}`,
        teks: `Permintaan baru: ${item.kota}`,
        waktu: item.tanggal_input,
        ikon: <IkonPlusCircle />,
      }));
    const dariKeputusan = keputusan
      .filter((item) => item.tanggal_keputusan)
      .map((item) => ({
        id: `k-${item.id}`,
        teks: `Keputusan distribusi: ${item.kota_tujuan}`,
        waktu: item.tanggal_keputusan,
        ikon: <IkonTrendUp />,
      }));

    return [...dariPermintaan, ...dariKeputusan]
      .sort((first, second) => parseDate(second.waktu) - parseDate(first.waktu))
      .slice(0, 4);
  }, [permintaan, keputusan]);

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Ringkasan data permintaan dan keputusan distribusi."
      />
      <div className="bento-grid">
        <div className="bento-span-full">
          <HeroStrip nama={userAktif?.nama} role={userAktif?.role} />
        </div>

        {duplicateGroups.length > 0 ? (
          <div
            className="bento-span-full"
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(245,158,11,0.3)",
              borderLeft: "3px solid var(--color-warning)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              fontSize: "var(--text-sm)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flex: 1, minWidth: "200px" }}>
              <IkonWarningTriangle />
              <span style={{ color: "var(--color-text-secondary)" }}>
                Ditemukan {formatterAngka.format(duplicateGroups.length)} data duplikat. Periksa Manajemen Data.
              </span>
            </span>
            <button
              type="button"
              className="link-underline-hover"
              onClick={() => onNavigate?.("manajemen-data")}
              onMouseDown={onMouseDown}
              style={{
                color: "var(--color-warning)",
                fontWeight: "var(--font-weight-semibold)",
                fontSize: "var(--text-sm)",
                whiteSpace: "nowrap",
              }}
            >
              Periksa sekarang →
              <RippleSpans ripples={ripples} removeRipple={removeRipple} />
            </button>
          </div>
        ) : null}

        <div className="bento-span-2 bento-row-2">
          <MetricCard
            label="Total Data Permintaan"
            nilai={formatterAngka.format(totalPermintaan)}
            ikon={<IkonDatabase />}
            accent="primary"
            size="lg"
            trend="Data terkini"
            shimmer
            style={{ height: "100%", justifyContent: "space-between" }}
          >
            {permintaanPerKota.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "var(--space-2)" }}>
                {permintaanPerKota.map((item) => (
                  <div key={item.kota} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span
                      style={{
                        width: "84px",
                        flexShrink: 0,
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.kota}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        height: "6px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--color-surface-2)",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: `${item.persen}%`,
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--color-primary)",
                        }}
                      />
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                      {item.jumlah}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </MetricCard>
        </div>

        <div className="bento-span-2">
          <MetricCard
            label="Data Terbaru Diinput"
            nilai={formatDateSingkat(latestDate)}
            ikon={<IkonKalender />}
            accent="accent"
            size="lg"
            valueFontSize="var(--text-xl)"
            trend="Data terkini"
            shimmer
            style={{ height: "100%" }}
          />
        </div>

        <div className="bento-span-2" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <ActionCard
            ikon={<IkonPlusCircle />}
            iconColor="var(--color-primary)"
            judul="Input Data Baru"
            sub="Tambah permintaan kota baru"
            onClick={() => onNavigate?.("input-data")}
          />
        </div>
        <div className="bento-span-2" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <ActionCard
            ikon={<IkonTableList />}
            iconColor="var(--color-accent)"
            judul="Kelola Data"
            sub="Edit atau hapus data permintaan"
            onClick={() => onNavigate?.("manajemen-data")}
          />
        </div>

        <div className="bento-span-full">
          <Card>
            <SectionHeader>Aktivitas Terbaru</SectionHeader>
            {aktivitasTerbaru.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {aktivitasTerbaru.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {item.ikon}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.teks}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                      {formatWaktuRelatif(item.waktu)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState pesan="Belum ada aktivitas untuk ditampilkan." />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function DashboardManajer({ permintaan, keputusan, userAktif, daftarKota, stokTbs }) {
  const [feedback, setFeedback] = useState("");
  const todayKey = getLocalDateKey();
  const rankingKota = useMemo(
    () => aggregatePermintaanRanking(permintaan),
    [permintaan]
  );
  const rekomendasiList = useMemo(
    () => computeRekomendasiDistribusi(permintaan, daftarKota, stokTbs),
    [permintaan, daftarKota, stokTbs]
  );
  const latestDecisionByKota = useMemo(
    () => getLatestKeputusanByKota(keputusan),
    [keputusan]
  );
  const forecastByKota = useMemo(() => {
    const forecasts = computeForecastPerKota(permintaan);
    return new Map(forecasts.map((item) => [item.kota, item]));
  }, [permintaan]);
  const kpi = useMemo(
    () => computeKpiMetrics(keputusan, permintaan, daftarKota),
    [keputusan, permintaan, daftarKota]
  );
  const totalTbsTerdistribusi = keputusan
    .filter((item) => item.status !== "menunggu")
    .reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0);

  const maxTotal = rankingKota[0]?.totalPermintaan ?? 0;

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) {
      return { backgroundColor: "var(--color-accent-subtle)", color: "var(--color-accent)", fontWeight: 700 };
    }
    if (rank === 2) {
      return { backgroundColor: "rgba(156,163,175,0.15)", color: "#9ca3af" };
    }
    if (rank === 3) {
      return { backgroundColor: "rgba(184,135,51,0.15)", color: "#b87333" };
    }
    return { backgroundColor: "transparent", color: "var(--color-text-muted)" };
  };

  const rankingRows = rankingKota.map((item, index) => ({
    id: item.kota,
    nomor: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "26px",
          padding: "2px 8px",
          borderRadius: "var(--radius-xs)",
          fontSize: "var(--text-sm)",
          ...getRankBadgeStyle(index + 1),
        }}
      >
        {index === 0 ? "🏆" : index + 1}
      </span>
    ),
    namaKota: item.kota,
    totalPermintaan: (
      <div>
        <span>{formatTonase(item.totalPermintaan)}</span>
        <div
          style={{
            marginTop: "4px",
            height: "3px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-primary)",
              width: `${maxTotal > 0 ? (item.totalPermintaan / maxTotal) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    ),
    statusDistribusi: (
      <Badge
        status={latestDecisionByKota.get(item.kota)?.status ?? "menunggu"}
      />
    ),
  }));

  const rekomendasiKota = rekomendasiList[0];

  const handleTetapkanDistribusi = async () => {
    if (!rekomendasiKota) {
      return;
    }

    // SYNCHRONOUS cache read — stays unchanged (this handler reads the
    // current in-memory state, not a fresh server fetch).
    const keputusanSaatIni = store.getKeputusan();
    const existingDecision = keputusanSaatIni.find(
      (item) =>
        item.kota_tujuan === rekomendasiKota.kota &&
        item.status !== "selesai"
    );

    if (existingDecision) {
      setFeedback(
        `Kota ${rekomendasiKota.kota} sudah memiliki keputusan distribusi aktif.`
      );
      return;
    }

    try {
      await store.addKeputusan({
        kota_tujuan: rekomendasiKota.kota,
        volume_tbs: rekomendasiKota.alokasi,
        tanggal_keputusan: todayKey,
        diputuskan_oleh: "Manajer Distribusi",
        status: "menunggu",
      });

      setFeedback(
        `Keputusan distribusi untuk ${rekomendasiKota.kota} berhasil ditambahkan (alokasi ${formatTonase(rekomendasiKota.alokasi)}).`
      );
    } catch {
      // runMutation already Toasted the server's error message.
    }
  };

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Pantau ranking permintaan dan ambil keputusan distribusi."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <HeroStrip nama={userAktif?.nama} role={userAktif?.role} />

        <div
          className="stagger-children app-grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            label="Total Kota Terpantau"
            nilai={formatterAngka.format(rankingKota.length)}
            ikon={<IkonMapPin />}
            accent="primary"
            size="lg"
            trend="Data terkini"
            shimmer
          />
          <MetricCard
            label="Permintaan Tertinggi"
            nilai={rankingKota[0] ? formatTonase(rankingKota[0].totalPermintaan) : "Belum ada"}
            ikon={<IkonTrendUp />}
            accent="accent"
            size="lg"
            trend="Data terkini"
            sparkline={rankingKota[0] ? forecastByKota.get(rankingKota[0].kota)?.riwayat : undefined}
            shimmer
          />
          <MetricCard
            label="Total TBS Terdistribusi"
            nilai={formatTonase(totalTbsTerdistribusi)}
            ikon={<IkonTruck />}
            accent="info"
            size="lg"
            trend="Data terkini"
            shimmer
          />
        </div>

        <div
          className="stagger-children app-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard label="Tingkat Pemenuhan" nilai={`${kpi.fulfillmentRate}%`} accent="primary" />
          <MetricCard
            label="Ketepatan Waktu"
            nilai={kpi.onTimeRate === null ? "Belum ada data" : `${kpi.onTimeRate}%`}
            accent="info"
          />
          <MetricCard
            label="Rata-rata Siklus"
            nilai={kpi.avgSiklusJam === null ? "Belum ada data" : `${Math.round(kpi.avgSiklusJam)} jam`}
            accent="accent"
          />
          <MetricCard
            label="Cakupan Kota"
            nilai={`${kpi.kotaTercover}/${kpi.totalKota} kota`}
            accent="success"
          />
        </div>

        <div
          className="app-grid-2-1"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "var(--space-5)",
            alignItems: "start",
          }}
        >
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-3)",
                paddingBottom: "var(--space-3)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-wider)",
                }}
              >
                Ranking Kota
              </span>
              <span
                style={{
                  backgroundColor: "var(--color-surface-3)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-xs)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {rankingKota.length} kota
              </span>
            </div>
            {rankingRows.length > 0 ? (
              <Tabel
                kolom={[
                  { key: "nomor", label: "No" },
                  { key: "namaKota", label: "Nama Kota" },
                  { key: "totalPermintaan", label: "Total Permintaan (ton)", numeric: true },
                  { key: "statusDistribusi", label: "Status Distribusi" },
                ]}
                data={rankingRows}
                getRowStyle={(_baris, index) =>
                  index === 0 ? { backgroundColor: "rgba(242,167,27,0.06)" } : undefined
                }
              />
            ) : (
              <EmptyState pesan="Tambahkan data permintaan agar ranking kota dapat dihitung." />
            )}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <Card
              style={{
                background: "linear-gradient(145deg, #1a2e23 0%, #0f1f17 100%)",
                border: "1px solid rgba(45,106,79,0.3)",
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-6)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: "-60px",
                  right: "-60px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(45,106,79,0.2), transparent)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative" }}>
                {rekomendasiKota ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "rgba(45,106,79,0.2)",
                        border: "1px solid rgba(45,106,79,0.3)",
                        color: "var(--color-primary)",
                        fontSize: "var(--text-2xs)",
                        fontWeight: "var(--font-weight-semibold)",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        marginBottom: "var(--space-3)",
                      }}
                    >
                      Rekomendasi Sistem · Skor {rekomendasiKota.skor}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--text-xs)",
                        color: "rgba(255,255,255,0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "var(--tracking-wider)",
                      }}
                    >
                      Kota Tujuan Disarankan
                    </p>
                    <p
                      style={{
                        margin: "var(--space-2) 0",
                        fontSize: "var(--text-2xl)",
                        fontWeight: "var(--font-weight-bold)",
                        color: "#fff",
                      }}
                    >
                      {rekomendasiKota.kota}
                    </p>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.6)" }}>
                      Permintaan{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)", fontWeight: "var(--font-weight-semibold)" }}>
                        {formatTonase(rekomendasiKota.totalPermintaan)}
                      </span>
                      {" · "}Kapasitas{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>
                        {formatTonase(rekomendasiKota.kapasitas)}
                      </span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.6)" }}>
                      Alokasi disarankan{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: "var(--font-weight-semibold)" }}>
                        {formatTonase(rekomendasiKota.alokasi)}
                      </span>
                    </p>
                    {!rekomendasiKota.terpenuhiPenuh ? (
                      <p style={{ margin: "6px 0 0", fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                        ⚠ {rekomendasiKota.dibatasiKapasitas
                          ? "Dibatasi oleh kapasitas kota."
                          : "Dibatasi oleh ketersediaan stok TBS."}
                      </p>
                    ) : null}
                    <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "var(--space-4) 0" }} />
                    <Tombol
                      label="Tetapkan Tujuan"
                      onClick={handleTetapkanDistribusi}
                      style={{ width: "100%", padding: "10px" }}
                    />
                    {feedback ? (
                      <p style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.6)" }}>
                        {feedback}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <EmptyState pesan="Belum ada rekomendasi karena data permintaan masih kosong." />
                )}
              </div>
            </Card>

            {rankingKota.length > 0 ? <GrafikMiniPerKota rankingKota={rankingKota} /> : null}
          </div>
        </div>

        {rankingKota.length > 0 ? (
          <GrafikPermintaan rankingKota={rankingKota} />
        ) : (
          <EmptyState pesan="Belum ada data untuk ditampilkan pada grafik permintaan." />
        )}
      </div>
    </>
  );
}

function DashboardLogistik({ keputusan, userAktif }) {
  const [selectedKeputusan, setSelectedKeputusan] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("menunggu");
  const [armada, setArmada] = useState("");
  const [eta, setEta] = useState("");
  const [isSelectFocused, setIsSelectFocused] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  const errorStyle = { margin: "6px 0 0", color: "var(--color-danger)", fontSize: "0.85rem", lineHeight: 1.5 };

  const sortedKeputusan = useMemo(
    () =>
      [...keputusan].sort(
        (first, second) =>
          parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
      ),
    [keputusan]
  );

  const latestKeputusan = sortedKeputusan[0];

  const ringkasanStatus = useMemo(() => {
    const counts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
    sortedKeputusan.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });
    return counts;
  }, [sortedKeputusan]);

  const statusRows = sortedKeputusan.map((item) => {
    const stepIndex = statusUrutan.indexOf(item.status);

    return {
      id: item.id,
      kotaTujuan: item.kota_tujuan,
      volume: formatTonase(item.volume_tbs),
      armada: item.armada ? `${item.armada}${item.eta ? ` · ETA ${formatDate(item.eta)}` : ""}` : "-",
      status: <Badge status={item.status} />,
      tanggal: formatDate(item.tanggal_keputusan),
      progres: (
        <div style={{ display: "flex", alignItems: "center" }}>
          {statusUrutan.map((_step, dotIndex) => (
            <span key={dotIndex} style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: dotIndex <= stepIndex ? "var(--color-primary)" : "transparent",
                  border: dotIndex <= stepIndex ? "none" : "1.5px solid var(--color-border-mid)",
                  flexShrink: 0,
                }}
              />
              {dotIndex < statusUrutan.length - 1 ? (
                <span
                  style={{
                    width: "16px",
                    height: "1.5px",
                    backgroundColor: dotIndex < stepIndex ? "var(--color-primary)" : "var(--color-border-mid)",
                  }}
                />
              ) : null}
            </span>
          ))}
        </div>
      ),
    };
  });

  const openStatusModal = (item) => {
    setModalErrors({});
    setSelectedKeputusan(item);
    setSelectedStatus(item.status);
    setArmada(item.armada ?? "");
    setEta(item.eta ?? "");
  };

  const validateModalForm = () => {
    const nextErrors = {};

    if (selectedStatus === "dalam-pengiriman") {
      if (!armada.trim()) {
        nextErrors.armada = "Armada / Sopir wajib diisi saat status Dalam Pengiriman.";
      }
      if (!eta) {
        nextErrors.eta = "Estimasi Tiba (ETA) wajib dipilih saat status Dalam Pengiriman.";
      }
    }

    return nextErrors;
  };

  const saveStatus = async () => {
    if (!selectedKeputusan) {
      return;
    }

    const nextErrors = validateModalForm();
    setModalErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const updates = { status: selectedStatus };
    if (selectedStatus === "dalam-pengiriman") {
      updates.armada = armada.trim();
      updates.eta = eta;
    }

    try {
      await store.updateKeputusan(selectedKeputusan.id, updates);
      // Success UI strictly after the await (LOGIC-02): on a 409 conflict
      // the await throws before reaching here, so the modal never closes
      // on a false success.
      setModalErrors({});
      setSelectedKeputusan(null);
    } catch {
      // runMutation already Toasted the server's conflict/error message;
      // keep the modal open so the user sees it and can retry.
    }
  };

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Pantau dan perbarui status distribusi yang sedang berjalan."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <HeroStrip nama={userAktif?.nama} role={userAktif?.role} />

        <div
          className="stagger-children app-grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            label="Menunggu"
            nilai={String(ringkasanStatus.menunggu)}
            ikon={<IkonClock />}
            accent="warning"
            size="lg"
            trend="Data terkini"
            shimmer
          />
          <MetricCard
            label="Dalam Pengiriman"
            nilai={String(ringkasanStatus["dalam-pengiriman"])}
            ikon={<IkonTruck />}
            accent="info"
            size="lg"
            trend="Data terkini"
            shimmer
          />
          <MetricCard
            label="Selesai"
            nilai={String(ringkasanStatus.selesai)}
            ikon={<IkonCheckCircle />}
            accent="success"
            size="lg"
            trend="Data terkini"
            shimmer
          />
        </div>

        {latestKeputusan ? (
          <Card
            style={{
              border: "1px solid var(--color-border-mid)",
              borderLeft: "3px solid var(--color-accent)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-5) var(--space-6)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-2xs)",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-wider)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                Keputusan Terbaru
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-text-primary)",
                }}
              >
                {latestKeputusan.kota_tujuan}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {formatDate(latestKeputusan.tanggal_keputusan)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-weight-bold)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-accent)",
                }}
              >
                {formatterAngka.format(latestKeputusan.volume_tbs)}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>ton</p>
            </div>
          </Card>
        ) : (
          <EmptyState pesan="Belum ada keputusan distribusi yang dapat ditindaklanjuti." />
        )}

        <Card>
          <SectionHeader>Status Distribusi</SectionHeader>
          {statusRows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "kotaTujuan", label: "Kota Tujuan" },
                { key: "volume", label: "Volume", numeric: true },
                { key: "armada", label: "Armada / ETA" },
                { key: "status", label: "Status" },
                { key: "progres", label: "Progres" },
                { key: "tanggal", label: "Tanggal" },
              ]}
              data={statusRows}
              aksi={(baris) => {
                const item = sortedKeputusan.find((keputusanItem) => keputusanItem.id === baris.id);
                return (
                  <Tombol
                    label={
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <IkonEditKecil /> Perbarui Status
                      </span>
                    }
                    variant="sekunder"
                    onClick={() => openStatusModal(item)}
                    style={{ padding: "5px 10px", fontSize: "var(--text-xs)" }}
                  />
                );
              }}
            />
          ) : (
            <EmptyState pesan="Belum ada data status distribusi untuk ditampilkan." />
          )}
        </Card>
      </div>

      {selectedKeputusan ? (
        <Modal
          judul="Perbarui status distribusi"
          onTutup={() => setSelectedKeputusan(null)}
          konten={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  Pilih status terbaru untuk distribusi menuju{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {selectedKeputusan.kota_tujuan}
                  </strong>
                  .
                </p>
              </div>
              <select
                aria-label="Pilih status terbaru"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                onFocus={() => setIsSelectFocused(true)}
                onBlur={() => setIsSelectFocused(false)}
                style={{
                  width: "100%",
                  border: `1px solid ${isSelectFocused ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  padding: "9px 12px",
                  outline: "none",
                  boxShadow: isSelectFocused ? "0 0 0 3px var(--color-primary-subtle)" : "none",
                  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                }}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              {selectedStatus === "dalam-pengiriman" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Armada / Sopir
                    </span>
                    <input
                      type="text"
                      value={armada}
                      onChange={(event) => {
                        setArmada(event.target.value);
                        setModalErrors({ ...modalErrors, armada: undefined });
                      }}
                      placeholder="Contoh: Truk B-1234-XY / Andi"
                      style={{
                        width: "100%",
                        border: modalErrors.armada
                          ? "1px solid var(--color-danger)"
                          : "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-surface-2)",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "9px 12px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {modalErrors.armada ? <p style={errorStyle}>{modalErrors.armada}</p> : null}
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Estimasi Tiba (ETA)
                    </span>
                    <input
                      type="date"
                      value={eta}
                      onChange={(event) => {
                        setEta(event.target.value);
                        setModalErrors({ ...modalErrors, eta: undefined });
                      }}
                      style={{
                        width: "100%",
                        border: modalErrors.eta
                          ? "1px solid var(--color-danger)"
                          : "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-surface-2)",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "9px 12px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {modalErrors.eta ? <p style={errorStyle}>{modalErrors.eta}</p> : null}
                  </label>
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Tombol
                  label="Batal"
                  variant="sekunder"
                  onClick={() => setSelectedKeputusan(null)}
                />
                <Tombol label="Simpan Status" onClick={saveStatus} />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

function Dashboard({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    store.loadKeputusan();
    store.loadRiwayatKeputusan();
    store.loadKota();
    store.loadPermintaan();
    store.loadStok();
  }, []);

  const { roleAktif, permintaan, keputusan, userAktif, daftarKota, stokTbs } = snapshot;

  const contentByRole = {
    Admin: (
      <DashboardAdmin
        permintaan={permintaan}
        keputusan={keputusan}
        userAktif={userAktif}
        onNavigate={onNavigate}
      />
    ),
    "Manajer Distribusi": (
      <DashboardManajer
        permintaan={permintaan}
        keputusan={keputusan}
        userAktif={userAktif}
        daftarKota={daftarKota}
        stokTbs={stokTbs}
      />
    ),
    "Tim Logistik": <DashboardLogistik keputusan={keputusan} userAktif={userAktif} />,
  };

  return (
    contentByRole[roleAktif] ?? (
      <EmptyState pesan="Role aktif belum dikenali. Pilih role lain pada header aplikasi." />
    )
  );
}

export default Dashboard;
