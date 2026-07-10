import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Sparkline from "../components/Sparkline";
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
import { computeForecastPerKota } from "../utils/forecast";
import { formatDate, formatTonase } from "../utils/format";
import useLiveChart from "../hooks/useLiveChart";

// Tampilan chip arah tren peramalan (Neo-Brutalism: border hitam, pill).
const TREN_CHIP = {
  naik: { label: "Naik", ikon: "trending_up", bg: "var(--color-lime)" },
  turun: { label: "Turun", ikon: "trending_down", bg: "var(--color-pastel)" },
  stabil: { label: "Stabil", ikon: "trending_flat", bg: "var(--color-surface)" },
};

function ChipTren({ trend }) {
  const chip = TREN_CHIP[trend] ?? TREN_CHIP.stabil;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        border: "2px solid #000000",
        borderRadius: "var(--radius-full)",
        padding: "2px 10px",
        backgroundColor: chip.bg,
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-primary)",
      }}
    >
      <span
        className="material-symbols-outlined"
        aria-hidden="true"
        style={{ fontSize: "14px", lineHeight: 1 }}
      >
        {chip.ikon}
      </span>
      {chip.label}
    </span>
  );
}

// Peramalan permintaan per kota (MIS): rata-rata bergerak window 3 sebagai
// estimasi kebutuhan periode berikutnya, dibandingkan dengan stok saat ini.
function PeramalanPermintaan({ forecastList, stokTbs }) {
  const totalEstimasi = Math.round(
    forecastList.reduce((total, item) => total + item.rataRata, 0) * 10
  ) / 10;
  const selisih = Math.round((stokTbs - totalEstimasi) * 10) / 10;
  const isDefisit = selisih < 0;

  const kotakRingkasan = [
    { label: "Estimasi Kebutuhan Berikutnya", nilai: formatTonase(totalEstimasi) },
    { label: "Stok TBS Saat Ini", nilai: formatTonase(stokTbs) },
    {
      label: isDefisit ? "Defisit Stok" : "Sisa Setelah Terpenuhi",
      nilai: formatTonase(Math.abs(selisih)),
      merah: isDefisit,
    },
  ];

  return (
    <Card>
      <SectionHeader>Peramalan Permintaan per Kota</SectionHeader>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
          fontSize: "var(--text-sm)",
        }}
      >
        Estimasi kebutuhan periode berikutnya per kota memakai rata-rata bergerak 3 permintaan terakhir.
        Gunakan untuk mengantisipasi kebutuhan stok sebelum permintaan resmi masuk.
      </p>

      <div
        className="app-grid-3"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
      >
        {kotakRingkasan.map((box) => (
          <div
            key={box.label}
            style={{
              border: "2px solid #000000",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3) var(--space-4)",
              backgroundColor: box.merah ? "var(--color-danger-bg)" : "var(--color-pastel-card)",
            }}
          >
            <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>
              {box.label}
            </p>
            <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: box.merah ? "var(--color-danger-text)" : "var(--color-on-surface)" }}>
              {box.nilai}
            </p>
          </div>
        ))}
      </div>

      {isDefisit ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            border: "2px solid #000000",
            borderLeft: "6px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding: "8px 10px",
            backgroundColor: "var(--color-danger-bg)",
            marginBottom: "var(--space-4)",
          }}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: "16px", lineHeight: 1, color: "#000000", marginTop: "1px" }}>
            error
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
            Stok saat ini tidak cukup menutup estimasi kebutuhan periode berikutnya — pertimbangkan penambahan stok atau prioritas alokasi.
          </span>
        </div>
      ) : null}

      <Tabel
        kolom={[
          { key: "namaKota", label: "Kota" },
          { key: "riwayat", label: "Riwayat Permintaan" },
          { key: "nilaiTerakhir", label: "Terakhir (ton)", numeric: true },
          { key: "estimasi", label: "Estimasi Berikutnya (ton)", numeric: true },
          { key: "tren", label: "Tren" },
        ]}
        data={forecastList.map((item) => ({
          id: item.kota,
          namaKota: item.kota,
          riwayat:
            item.riwayat.length >= 2 ? (
              <Sparkline data={item.riwayat} width={96} height={24} />
            ) : (
              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                Data kurang ({item.jumlahData})
              </span>
            ),
          nilaiTerakhir: formatTonase(item.nilaiTerakhir),
          estimasi: (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              {formatTonase(item.rataRata)}
            </span>
          ),
          tren: <ChipTren trend={item.trend} />,
        }))}
      />
    </Card>
  );
}

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

  return { backgroundColor: "var(--color-surface-container-low)", color: "var(--color-text-secondary)" };
};

function GrafikRankingHorizontal({ ranking }) {
  const sig = useMemo(
    () => JSON.stringify(ranking.map((item) => [item.kota, item.totalPermintaan])),
    [ranking]
  );

  const buildData = () => {
    const colors = ranking.map((_item, index) => CHART_PALETTE[index % CHART_PALETTE.length]);
    return {
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
    };
  };

  const { canvasRef, error: chartError, isReady: isChartReady } = useLiveChart({
    sig,
    canDraw: ranking.length > 0,
    buildConfig: () => ({
      type: "bar",
      data: buildData(),
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
    }),
    applyData: (chart) => {
      const next = buildData();
      chart.data.labels = next.labels;
      chart.data.datasets = next.datasets;
    },
  });

  return (
    <Card style={{ minHeight: "420px", animationDelay: "60ms" }}>
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

  useEffect(() => {
    store.loadPermintaan();
    store.loadKota();
    store.loadStok();
    store.loadRekomendasi();
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

  const rekomendasi = snapshot.rekomendasi ?? [];
  const stokTbs = snapshot.stokTbs ?? 0;

  // Peramalan kebutuhan per kota (MIS) — rata-rata bergerak window 3.
  const forecastList = useMemo(
    () => computeForecastPerKota(snapshot.permintaan ?? []),
    [snapshot.permintaan]
  );

  // Rata-rata permintaan harian 30 hari untuk simulasi ketahanan stok.
  const rataHarian = useMemo(() => {
    const batas = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const arr = (snapshot.permintaan ?? []).filter(
      (item) => item.tanggal_permintaan && new Date(`${item.tanggal_permintaan}T00:00:00`).getTime() >= batas
    );
    const total = arr.reduce((sum, item) => sum + (Number(item.jumlah_permintaan) || 0), 0);
    return total / 30;
  }, [snapshot.permintaan]);

  const [simInput, setSimInput] = useState("");
  const simNum = Number(simInput) || 0;
  const sisaStokSim = stokTbs - simNum;
  const hariBertahanSim = rataHarian > 0 ? Math.floor(Math.max(0, sisaStokSim) / rataHarian) : null;

  // Penjelasan skor otomatis per kota (top 5).
  const maxPermintaanRek = Math.max(1, ...rekomendasi.map((item) => item.totalPermintaan));
  const maxKapasitasRek = Math.max(1, ...rekomendasi.map((item) => item.kapasitas));
  const penjelasanList = rekomendasi.slice(0, 5).map((item) => {
    const persenPermintaan = Math.round((item.totalPermintaan / maxPermintaanRek) * 100);
    const persenKapasitas = Math.round((item.kapasitas / maxKapasitasRek) * 100);
    return {
      kota: item.kota,
      skor: item.skor,
      teks: `${item.kota} mendapat skor ${item.skor} karena total permintaan ${item.totalPermintaan} ton (${persenPermintaan} persen dari tertinggi) serta kapasitas ${item.kapasitas} ton (${persenKapasitas} persen dari terbesar).`,
    };
  });

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
        {index < 3 ? (
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: "16px", lineHeight: 1, fontVariationSettings: "'FILL' 1" }}
          >
            {index === 0 ? "emoji_events" : "military_tech"}
          </span>
        ) : null}
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
    <>
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
          {/* Metrik bento ala ranking_distribusi_switera. */}
          <div
            className="stagger-children app-grid-3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(200px, 1fr))", gap: "var(--space-4)" }}
          >
            <MetricCard
              label="Total Permintaan (Ton)"
              nilai={`${ranking.reduce((total, item) => total + item.totalPermintaan, 0)} ton`}
              size="lg"
              accent="primary"
            />
            <MetricCard
              label="Rata-rata Skor Pemenuhan"
              nilai={
                rekomendasi.length > 0
                  ? String(Math.round(rekomendasi.reduce((total, item) => total + item.skor, 0) / rekomendasi.length))
                  : "-"
              }
              size="lg"
              accent="info"
            />
            <MetricCard
              label="Kota Prioritas Tinggi"
              nilai={String(rekomendasi.filter((item) => !item.terpenuhiPenuh).length)}
              size="lg"
              accent="warning"
            />
          </div>

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
                index === 0 ? { backgroundColor: "var(--color-pastel-card)" } : undefined
              }
            />
          </Card>

          <GrafikRankingHorizontal ranking={ranking} />

          {/* Peramalan kebutuhan periode berikutnya (MIS): dari data historis ke antisipasi. */}
          {forecastList.length > 0 ? (
            <PeramalanPermintaan forecastList={forecastList} stokTbs={stokTbs} />
          ) : null}

          {/* Simulasi distribusi + penjelasan skor otomatis (MIS). */}
          <div className="app-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}>
            <Card>
              <SectionHeader>Simulasi Distribusi</SectionHeader>
              <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Masukkan jumlah ton yang akan didistribusikan untuk melihat sisa stok dan ketahanannya secara langsung.
              </p>
              <label style={{ display: "block", marginBottom: "var(--space-3)" }}>
                <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", marginBottom: "4px", color: "var(--color-text-secondary)" }}>
                  Jumlah Distribusi (ton)
                </span>
                <input
                  type="number"
                  min="0"
                  value={simInput}
                  onChange={(event) => setSimInput(event.target.value)}
                  placeholder="0"
                  style={{ width: "100%", maxWidth: "220px", border: "2px solid #000000", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: "10px 14px", outline: "none", boxShadow: "var(--shadow-sm)", boxSizing: "border-box" }}
                />
              </label>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "140px", border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)", backgroundColor: sisaStokSim < 0 ? "var(--color-danger-bg)" : "var(--color-pastel-card)" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>Sisa Stok</p>
                  <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: sisaStokSim < 0 ? "var(--color-danger-text)" : "var(--color-on-surface)" }}>{formatTonase(sisaStokSim)}</p>
                </div>
                <div style={{ flex: 1, minWidth: "140px", border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)", backgroundColor: "var(--color-pastel-card)" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>Bertahan</p>
                  <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>{hariBertahanSim !== null ? `${hariBertahanSim} hari` : "Tak terukur"}</p>
                </div>
              </div>
              {sisaStokSim < 0 ? (
                <p style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-xs)", color: "var(--color-danger-text)", fontWeight: "var(--font-weight-semibold)" }}>
                  Jumlah melebihi stok tersedia ({formatTonase(stokTbs)}).
                </p>
              ) : null}
            </Card>

            <Card>
              <SectionHeader>Penjelasan Skor Otomatis</SectionHeader>
              {penjelasanList.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {penjelasanList.map((item) => (
                    <div key={item.kota} style={{ border: "2px solid #000000", borderLeft: "8px solid var(--color-lime)", borderRadius: "var(--radius-lg)", padding: "var(--space-2) var(--space-4)", backgroundColor: "var(--color-surface)" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{item.teks}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState pesan="Belum ada rekomendasi untuk dijelaskan." />
              )}
            </Card>
          </div>

          {rekomendasi.length > 0 ? (
            <Card style={{ animationDelay: "80ms" }}>
              <SectionHeader>Skor & Alokasi Distribusi</SectionHeader>
              <p
                style={{
                  margin: "0 0 1rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  fontSize: "var(--text-sm)",
                }}
              >
                Dihitung server berdasarkan skor gabungan: 65% permintaan + 35% kapasitas.
              </p>
              <Tabel
                kolom={[
                  { key: "peringkat", label: "#" },
                  { key: "namaKota", label: "Kota" },
                  { key: "skor", label: "Skor", numeric: true },
                  { key: "totalPermintaan", label: "Permintaan (ton)", numeric: true },
                  { key: "kapasitas", label: "Kapasitas (ton)", numeric: true },
                  { key: "alokasi", label: "Alokasi (ton)", numeric: true },
                  { key: "status", label: "Status" },
                ]}
                data={rekomendasi.map((item, index) => ({
                  id: item.kota,
                  peringkat: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "26px",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-xs)",
                        fontSize: "var(--text-sm)",
                        ...getRankColor(index + 1),
                      }}
                    >
                      {index + 1}
                    </span>
                  ),
                  namaKota: item.kota,
                  skor: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, minWidth: "28px", textAlign: "right" }}>
                        {item.skor}
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          width: "72px",
                          height: "6px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--color-surface-container)",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${Math.max(0, Math.min(100, item.skor))}%`,
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--color-primary)",
                            transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </span>
                    </span>
                  ),
                  totalPermintaan: formatTonase(item.totalPermintaan),
                  kapasitas: formatTonase(item.kapasitas),
                  alokasi: (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: item.alokasi > 0 ? "var(--color-success)" : "var(--color-text-muted)",
                      }}
                    >
                      {formatTonase(item.alokasi)}
                    </span>
                  ),
                  status: item.terpenuhiPenuh ? (
                    <span style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", fontWeight: 600 }}>Terpenuhi</span>
                  ) : item.dibatasiKapasitas ? (
                    <span style={{ color: "var(--color-warning)", fontSize: "var(--text-xs)", fontWeight: 600 }}>Dibatasi Kapasitas</span>
                  ) : (
                    <span style={{ color: "var(--color-danger)", fontSize: "var(--text-xs)", fontWeight: 600 }}>Stok Tidak Cukup</span>
                  ),
                }))}
                getRowStyle={(_baris, index) =>
                  index === 0 ? { backgroundColor: "rgba(242,167,27,0.06)" } : undefined
                }
              />
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}

export default AnalisisRanking;
