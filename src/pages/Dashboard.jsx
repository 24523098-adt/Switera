import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import MetricCard from "../components/MetricCard";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { SkeletonChart } from "../components/Skeleton";
import useRipple from "../hooks/useRipple";
import store from "../store";
import {
  CHART_PALETTE,
  chartGridDefaults,
  chartTickDefaults,
  chartTooltipDefaults,
  withOpacity,
} from "../utils/chartDefaults";
import {
  aggregatePermintaanRanking,
  getDuplicateGroups,
  getLatestKeputusanByKota,
  getLocalDateKey,
  parseDate,
} from "../utils/distribusi";

const formatterAngka = new Intl.NumberFormat("id-ID");
const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const statusOptions = ["menunggu", "dalam-pengiriman", "selesai"];
const statusLabels = {
  menunggu: "Menunggu",
  "dalam-pengiriman": "Dalam Pengiriman",
  selesai: "Selesai",
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return formatterTanggal.format(parseDate(value));
};

const formatTonase = (value) => `${formatterAngka.format(value)} ton`;

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

function IkonDatabase() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 6V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12" stroke="currentColor" strokeWidth="1.8" />
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

function IkonPaket() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L20.5 7.5V16.5L12 21L3.5 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 7.5L12 12L20.5 7.5M12 12V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
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

function DashboardAdmin({ permintaan, keputusan, onNavigate }) {
  const totalData = permintaan.length + keputusan.length;
  const allDates = [
    ...permintaan.map((item) => item.tanggal_input),
    ...keputusan.map((item) => item.tanggal_keputusan),
  ].filter(Boolean);
  const latestDate = allDates.sort((first, second) => parseDate(second) - parseDate(first))[0];
  const duplicateGroups = getDuplicateGroups(permintaan);
  const { ripples, onMouseDown, removeRipple } = useRipple();

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Ringkasan data permintaan dan keputusan distribusi."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            label="Jumlah total data tersimpan"
            nilai={formatterAngka.format(totalData)}
            ikon={<IkonDatabase />}
            accent="primary"
          />
          <MetricCard
            label="Tanggal data terbaru diinput"
            nilai={formatDate(latestDate)}
            ikon={<IkonKalender />}
            accent="accent"
          />
        </div>

        {duplicateGroups.length > 0 ? (
          <Card
            style={{
              borderLeft: "6px solid var(--color-warning)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-primary)",
                  fontWeight: 700,
                }}
              >
                Peringatan data duplikat terdeteksi
              </p>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Terdapat {formatterAngka.format(duplicateGroups.length)} kelompok data
                dengan kota dan tanggal permintaan yang sama. Periksa halaman Manajemen
                Data untuk validasi lebih lanjut.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.("manajemen-data")}
                onMouseDown={onMouseDown}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  width: "fit-content",
                  padding: 0,
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--color-primary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Buka halaman Manajemen Data
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="ripple-span"
                    style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
                    onAnimationEnd={() => removeRipple(ripple.id)}
                  />
                ))}
              </button>
            </div>
          </Card>
        ) : null}

        <Card
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
              }}
            >
              Kelola data distribusi
            </h2>
            <p
              style={{
                margin: "0.4rem 0 0",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Tambahkan data permintaan baru untuk menjaga analisis distribusi tetap mutakhir.
            </p>
          </div>
          <Tombol
            label="Menuju Input Data"
            onClick={() => onNavigate?.("input-data")}
          />
        </Card>
      </div>
    </>
  );
}

function DashboardManajer({ permintaan, keputusan }) {
  const [feedback, setFeedback] = useState("");
  const todayKey = getLocalDateKey();
  const rankingKota = useMemo(
    () => aggregatePermintaanRanking(permintaan),
    [permintaan]
  );
  const latestDecisionByKota = useMemo(
    () => getLatestKeputusanByKota(keputusan),
    [keputusan]
  );
  const permintaanHariIni = useMemo(
    () => permintaan.filter((item) => item.tanggal_permintaan === todayKey),
    [permintaan, todayKey]
  );

  const kotaHariIni = useMemo(
    () => aggregatePermintaanRanking(permintaanHariIni)[0],
    [permintaanHariIni]
  );

  const totalTbsTerdistribusi = keputusan
    .filter((item) => item.status !== "menunggu")
    .reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0);

  const rankingRows = rankingKota.map((item, index) => ({
    id: item.kota,
    nomor: index + 1,
    namaKota: item.kota,
    totalPermintaan: formatTonase(item.totalPermintaan),
    statusDistribusi: (
      <Badge
        status={latestDecisionByKota.get(item.kota)?.status ?? "menunggu"}
      />
    ),
  }));

  const rekomendasiKota = rankingKota[0];

  const handleTetapkanDistribusi = () => {
    if (!rekomendasiKota) {
      return;
    }

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

    store.addKeputusan({
      kota_tujuan: rekomendasiKota.kota,
      volume_tbs: rekomendasiKota.totalPermintaan,
      tanggal_keputusan: todayKey,
      diputuskan_oleh: "Manajer Distribusi",
      status: "menunggu",
    });

    setFeedback(
      `Keputusan distribusi untuk ${rekomendasiKota.kota} berhasil ditambahkan.`
    );
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
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            label="Total kota terpantau"
            nilai={formatterAngka.format(rankingKota.length)}
            ikon={<IkonDatabase />}
            accent="primary"
          />
          <MetricCard
            label="Permintaan tertinggi hari ini"
            nilai={kotaHariIni ? formatTonase(kotaHariIni.totalPermintaan) : "Belum ada"}
            ikon={<IkonTrendUp />}
            accent="accent"
          />
          <MetricCard
            label="Total TBS terdistribusi"
            nilai={formatTonase(totalTbsTerdistribusi)}
            ikon={<IkonPaket />}
            accent="info"
          />
        </div>

        <Card>
          <SectionHeader>Ranking Permintaan Kota</SectionHeader>
          {rankingRows.length > 0 ? (
            <Tabel
              kolom={[
                { key: "nomor", label: "No" },
                { key: "namaKota", label: "Nama Kota" },
                { key: "totalPermintaan", label: "Total Permintaan (ton)", numeric: true },
                { key: "statusDistribusi", label: "Status Distribusi" },
              ]}
              data={rankingRows}
            />
          ) : (
            <EmptyState pesan="Tambahkan data permintaan agar ranking kota dapat dihitung." />
          )}
        </Card>

        {rankingKota.length > 0 ? (
          <GrafikPermintaan rankingKota={rankingKota} />
        ) : (
          <EmptyState pesan="Belum ada data untuk ditampilkan pada grafik permintaan." />
        )}

        <Card
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
              }}
            >
              Rekomendasi distribusi
            </h2>
            <p
              style={{
                margin: "0.4rem 0 0",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Prioritaskan kota dengan total permintaan tertinggi untuk keputusan distribusi berikutnya.
            </p>
          </div>

          {rekomendasiKota ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Kota prioritas saat ini
                  </p>
                  <p
                    style={{
                      margin: "0.3rem 0 0",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                    }}
                  >
                    {rekomendasiKota.kota}
                  </p>
                  <p
                    style={{
                      margin: "0.3rem 0 0",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Total permintaan {formatTonase(rekomendasiKota.totalPermintaan)}.
                  </p>
                </div>
                <Tombol
                  label="Tetapkan sebagai Tujuan Distribusi"
                  onClick={handleTetapkanDistribusi}
                />
              </div>
              {feedback ? (
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {feedback}
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState pesan="Belum ada rekomendasi karena data permintaan masih kosong." />
          )}
        </Card>
      </div>
    </>
  );
}

function DashboardLogistik({ keputusan }) {
  const [selectedKeputusan, setSelectedKeputusan] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("menunggu");
  const [isSelectFocused, setIsSelectFocused] = useState(false);

  const sortedKeputusan = useMemo(
    () =>
      [...keputusan].sort(
        (first, second) =>
          parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
      ),
    [keputusan]
  );

  const latestKeputusan = sortedKeputusan[0];

  const statusRows = sortedKeputusan.map((item) => ({
    id: item.id,
    kotaTujuan: item.kota_tujuan,
    volume: formatTonase(item.volume_tbs),
    status: <Badge status={item.status} />,
    tanggal: formatDate(item.tanggal_keputusan),
  }));

  const openStatusModal = (item) => {
    setSelectedKeputusan(item);
    setSelectedStatus(item.status);
  };

  const saveStatus = () => {
    if (!selectedKeputusan) {
      return;
    }

    store.updateKeputusan(selectedKeputusan.id, {
      status: selectedStatus,
    });
    setSelectedKeputusan(null);
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
        {latestKeputusan ? (
          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  fontSize: "0.9rem",
                }}
              >
                Keputusan distribusi terbaru
              </p>
              <h2
                style={{
                  margin: "0.35rem 0 0",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                }}
              >
                {latestKeputusan.kota_tujuan}
              </h2>
              <p
                style={{
                  margin: "0.45rem 0 0",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Volume {formatTonase(latestKeputusan.volume_tbs)} ditetapkan pada{" "}
                {formatDate(latestKeputusan.tanggal_keputusan)}.
              </p>
            </div>
            <Badge status={latestKeputusan.status} />
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
                { key: "status", label: "Status" },
                { key: "tanggal", label: "Tanggal" },
              ]}
              data={statusRows}
              aksi={(baris) => {
                const item = sortedKeputusan.find((keputusanItem) => keputusanItem.id === baris.id);
                return (
                  <Tombol
                    label="Perbarui Status"
                    variant="sekunder"
                    onClick={() => openStatusModal(item)}
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

  const { roleAktif, permintaan, keputusan } = snapshot;

  const contentByRole = {
    Admin: (
      <DashboardAdmin
        permintaan={permintaan}
        keputusan={keputusan}
        onNavigate={onNavigate}
      />
    ),
    "Manajer Distribusi": (
      <DashboardManajer permintaan={permintaan} keputusan={keputusan} />
    ),
    "Tim Logistik": <DashboardLogistik keputusan={keputusan} />,
  };

  return (
    <Layout
      title="Switera"
      roleAwal={roleAktif}
      menuAwal="dashboard"
      onMenuChange={onNavigate}
    >
      {contentByRole[roleAktif] ?? (
        <EmptyState pesan="Role aktif belum dikenali. Pilih role lain pada header aplikasi." />
      )}
    </Layout>
  );
}

export default Dashboard;
