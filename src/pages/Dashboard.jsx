import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import useLiveChart from "../hooks/useLiveChart";
import store from "../store";
import { formatWaktuRelatif } from "../utils/waktu";
import { formatterAngka, formatDate, formatDateSingkat, formatTonase } from "../utils/format";
import {
  chartAnimationDefaults,
  chartGridDefaults,
  chartTickDefaults,
  chartTooltipDefaults,
} from "../utils/chartDefaults";
import { downloadCsv } from "../utils/csv";
import { getDuplicateGroups, getLocalDateKey, parseDate } from "../utils/distribusi";
import {
  getMisSituasiHariIni,
  getMisTindakanMendesak,
  getMisRekomendasiPrioritas,
  getMisKeputusanBerjalan,
  getMisProyeksiStok,
  getKpi,
  getTargetKpi,
  setTargetKpi,
  getRiwayatKpi,
  sinkronNotifikasiMis,
} from "../api/apiClient";
import { showToast } from "../components/Toast";
import {
  computeExceptions,
  computeSlaBreaches,
  computePemenuhanPerKota,
  computeSiklusDetail,
} from "../utils/mis";

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
        backgroundColor: "var(--color-pastel-card)",
        borderRadius: "var(--radius-2xl)",
        padding: "var(--space-5) var(--space-6)",
        minHeight: "80px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--space-3)",
      }}
    >
      <div>
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
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-on-surface)",
          }}
        >
          {nama ?? "Pengguna"}
        </p>
        {role ? (
          <span
            style={{
              display: "inline-flex",
              marginTop: "var(--space-2)",
              backgroundColor: "var(--color-lime)",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              padding: "2px 12px",
              fontSize: "var(--text-xs)",
              color: "#000000",
              fontWeight: "var(--font-weight-bold)",
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

// Pilih ikon feed dari kata kunci teks aksi activity log backend
// (catatAktivitas: "Menambahkan data permintaan kota ...", "Menyimpan
// keputusan distribusi ...", "Stok TBS berkurang ...", dst).
function ikonUntukAksi(aksi) {
  const teks = aksi ?? "";
  if (/stok/i.test(teks)) return <IkonDatabase />;
  if (/keputusan|status|distribusi/i.test(teks)) return <IkonTruck />;
  if (/permintaan/i.test(teks)) return <IkonPlusCircle />;
  if (/kota/i.test(teks)) return <IkonMapPin />;
  if (/kata sandi|akun/i.test(teks)) return <IkonCheckCircle />;
  return <IkonClock />;
}

function DashboardAdmin({ permintaan, keputusan, activityLog, userAktif, daftarKota, stokTbs, daftarAkun, onNavigate }) {
  const totalPermintaan = permintaan.length;
  const allDates = permintaan.map((item) => item.tanggal_input).filter(Boolean);
  const latestDate = allDates.sort((first, second) => parseDate(second) - parseDate(first))[0];
  const duplicateGroups = getDuplicateGroups(permintaan);

  // ── Kesehatan sistem (MIS) untuk Admin ──
  const kesehatan = useMemo(() => {
    const kotaList = daftarKota ?? [];
    const akunList = daftarAkun ?? [];
    const todayKey = getLocalDateKey();

    const akunPerRole = akunList.reduce((acc, akun) => {
      acc[akun.role] = (acc[akun.role] ?? 0) + 1;
      return acc;
    }, {});

    const permintaanHariIni = permintaan.filter((item) => item.tanggal_input === todayKey).length;

    const exceptions = computeExceptions({ keputusan, permintaan, stokTbs: stokTbs ?? 0 });
    const adaKritis = exceptions.some((item) => item.severity === "kritis");
    const adaPerhatian = exceptions.some((item) => item.severity === "perhatian");
    const statusSistem = adaKritis ? "kritis" : adaPerhatian ? "perhatian" : "aman";

    const alokasiByKota = keputusan.reduce((map, item) => {
      map.set(item.kota_tujuan, (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0));
      return map;
    }, new Map());
    const utilList = kotaList
      .filter((kota) => Number(kota.kapasitas) > 0)
      .map((kota) => Math.min(100, ((alokasiByKota.get(kota.nama) || 0) / kota.kapasitas) * 100));
    const utilisasiKapasitas = utilList.length > 0 ? Math.round(utilList.reduce((a, b) => a + b, 0) / utilList.length) : 0;

    // Rekomendasi tindakan Admin dari kondisi nyata.
    const rekomendasi = [];
    if (duplicateGroups.length > 0) {
      rekomendasi.push({ teks: `${duplicateGroups.length} data permintaan duplikat perlu divalidasi.`, aksi: "manajemen-data" });
    }
    const exceptionStok = exceptions.find((item) => item.kategori === "Stok");
    if (exceptionStok) {
      rekomendasi.push({ teks: "Stok TBS perlu diperbarui atau ditambah.", aksi: "manajemen-kota" });
    }
    if (kotaList.length === 0) {
      rekomendasi.push({ teks: "Belum ada data kota. Tambahkan kota terlebih dahulu.", aksi: "manajemen-kota" });
    }

    return { akunPerRole, permintaanHariIni, anomaliCount: exceptions.length, utilisasiKapasitas, statusSistem, rekomendasi };
  }, [daftarKota, daftarAkun, permintaan, keputusan, stokTbs, duplicateGroups]);

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

  // Feed jejak audit sebenarnya dari tabel ActivityLog backend (bukan lagi
  // rekonstruksi dari permintaan/keputusan) — sumber yang sama dengan halaman
  // Riwayat Aktivitas, jadi setiap aksi penting (kota, stok, status, dll) ikut
  // tampil, bukan cuma dua jenis.
  const aktivitasTerbaru = useMemo(() => {
    return [...(activityLog ?? [])]
      .sort((first, second) => parseDate(second.waktu) - parseDate(first.waktu))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        teks: item.aksi,
        waktu: item.waktu,
        ikon: ikonUntukAksi(item.aksi),
      }));
  }, [activityLog]);

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Ringkasan data permintaan dan keputusan distribusi."
      />
      <div className="bento-grid stagger-children">
        <div className="bento-span-full">
          <HeroStrip nama={userAktif?.nama} role={userAktif?.role} />
        </div>

        <div className="bento-span-full">
          <Card style={{ borderRadius: "var(--radius-2xl)", padding: "var(--space-5) var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "var(--radius-full)",
                  border: "2px solid #000000",
                  backgroundColor:
                    kesehatan.statusSistem === "kritis"
                      ? "var(--color-status-error)"
                      : kesehatan.statusSistem === "perhatian"
                        ? "var(--color-status-warning)"
                        : "var(--color-status-success)",
                }}
              />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>
                Kesehatan Sistem
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                Status: {kesehatan.statusSistem}
              </span>
            </div>

            <div
              className="app-grid-4"
              style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
            >
              {[
                { label: "Akun Aktif", nilai: formatterAngka.format((daftarAkun ?? []).length), sub: Object.entries(kesehatan.akunPerRole).map(([r, n]) => `${r}: ${n}`).join(" · ") || "Belum ada" },
                { label: "Permintaan Hari Ini", nilai: formatterAngka.format(kesehatan.permintaanHariIni), sub: "Masuk hari ini" },
                { label: "Anomali Terdeteksi", nilai: formatterAngka.format(kesehatan.anomaliCount), sub: "Kondisi hari ini" },
                { label: "Utilisasi Kapasitas", nilai: `${kesehatan.utilisasiKapasitas}%`, sub: "Rata-rata semua kota" },
              ].map((box) => (
                <div key={box.label} style={{ border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)", backgroundColor: "var(--color-pastel-card)" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>{box.label}</p>
                  <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>{box.nilai}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{box.sub}</p>
                </div>
              ))}
            </div>

            {kesehatan.rekomendasi.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-muted)" }}>
                  Rekomendasi Tindakan
                </span>
                {kesehatan.rekomendasi.map((rek, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", border: "2px solid #000000", borderLeft: "8px solid var(--color-warning-text)", borderRadius: "var(--radius-lg)", padding: "var(--space-2) var(--space-4)", backgroundColor: "var(--color-warning-bg)", flexWrap: "wrap" }}>
                    <span style={{ flex: 1, minWidth: "160px", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: "var(--font-weight-semibold)" }}>{rek.teks}</span>
                    <button type="button" className="link-underline-hover" onClick={() => onNavigate?.(rek.aksi)} style={{ color: "var(--color-primary)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                      Tindak lanjut →
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        {duplicateGroups.length > 0 ? (
          <div
            className="bento-span-full"
            style={{
              backgroundColor: "var(--color-warning-bg)",
              border: "2px solid #000000",
              borderLeft: "8px solid var(--color-warning-text)",
              borderRadius: "var(--radius-lg)",
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
              /* Feed timeline ala Stitch: ikon bulat + garis penghubung vertikal. */
              <div style={{ display: "flex", flexDirection: "column" }}>
                {aktivitasTerbaru.map((item, index) => {
                  const isLast = index === aktivitasTerbaru.length - 1;

                  return (
                    <div key={item.id} style={{ display: "flex", gap: "var(--space-4)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <span
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--color-pastel)",
                            border: "2px solid #000000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#000000",
                          }}
                        >
                          {item.ikon}
                        </span>
                        {!isLast ? (
                          <span aria-hidden="true" style={{ width: "1px", flex: 1, backgroundColor: "var(--color-surface-variant)", marginTop: "6px" }} />
                        ) : null}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : "var(--space-4)", minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.teks}
                        </p>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px", fontSize: "var(--text-xs)", color: "var(--color-outline)" }}>
                          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: "14px", lineHeight: 1 }}>schedule</span>
                          {formatWaktuRelatif(item.waktu)}
                        </span>
                      </div>
                    </div>
                  );
                })}
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

// ── Dashboard Manajer Distribusi (MIS) ──────────────────────────────────────
// Lima bagian pendukung keputusan yang seluruhnya berasal dari endpoint MIS
// backend (/mis/*). Tidak ada tabel mentah tanpa olahan di sini (bukan TPS):
// setiap angka sudah diagregasi, diberi status, atau dibandingkan.

const STATUS_STOK_GAYA = {
  aman: { warna: "var(--color-success-text)", label: "Aman" },
  perhatian: { warna: "var(--color-warning-text)", label: "Perhatian" },
  kritis: { warna: "var(--color-danger-text)", label: "Kritis" },
};

const TINGKAT_GAYA = {
  kritis: { border: "var(--color-danger)", bg: "var(--color-danger-bg)", label: "Kritis", ikon: "error" },
  perhatian: { border: "var(--color-warning-text)", bg: "var(--color-warning-bg)", label: "Perhatian", ikon: "warning" },
  informasi: { border: "var(--color-info-text)", bg: "var(--color-info-bg)", label: "Informasi", ikon: "info" },
};

const STATUS_AKTIF_KEPUTUSAN = ["menunggu", "dalam-pengiriman"];

function IkonMS({ name, size = 20, fill = false, style }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{ fontSize: `${size}px`, lineHeight: 1, fontVariationSettings: `'FILL' ${fill ? 1 : 0}`, ...style }}
    >
      {name}
    </span>
  );
}

function StatBox({ label, nilai, sub, warna, ikon }) {
  return (
    <Card style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)", minHeight: "132px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          {label}
        </span>
        {ikon ? (
          <span
            style={{
              width: "36px",
              height: "36px",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-pastel)",
            }}
          >
            <IkonMS name={ikon} size={20} style={{ color: "#000000" }} />
          </span>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-3xl)",
          fontWeight: "var(--font-weight-bold)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: warna ?? "var(--color-on-surface)",
        }}
      >
        {nilai}
      </span>
      {sub ? <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{sub}</span> : null}
    </Card>
  );
}

// Bagian 1 — Situasi Hari Ini.
function SituasiHariIni({ situasi }) {
  if (!situasi) {
    return <SkeletonChart height="132px" />;
  }
  const gayaStok = STATUS_STOK_GAYA[situasi.statusStok] ?? STATUS_STOK_GAYA.aman;
  const surplus = situasi.defisitSurplus >= 0;

  return (
    <div
      className="stagger-children app-grid-4"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: "var(--space-4)" }}
    >
      <StatBox
        label="Stok TBS Tersisa"
        nilai={formatTonase(situasi.stokTersisa)}
        warna={gayaStok.warna}
        ikon="inventory_2"
        sub={situasi.hariStokHabis !== null ? `Habis dalam ${situasi.hariStokHabis} hari · ${gayaStok.label}` : "Konsumsi belum terukur"}
      />
      <StatBox
        label="Total Permintaan Menunggu"
        nilai={formatTonase(situasi.totalPermintaanMenunggu)}
        ikon="pending_actions"
        sub="Belum ada keputusan"
      />
      <StatBox
        label="Kota Belum Terpenuhi"
        nilai={`${formatterAngka.format(situasi.kotaBelumTerpenuhi)} kota`}
        ikon="location_off"
        sub="Dalam 7 hari terakhir"
      />
      <StatBox
        label={surplus ? "Surplus Stok" : "Defisit Stok"}
        nilai={formatTonase(Math.abs(situasi.defisitSurplus))}
        warna={surplus ? "var(--color-success-text)" : "var(--color-danger-text)"}
        ikon={surplus ? "trending_up" : "trending_down"}
        sub="Stok vs total permintaan menunggu"
      />
    </div>
  );
}

// Bagian 2 — Tindakan Mendesak.
function TindakanMendesakPanel({ tindakan, onNavigate }) {
  const kosong = Array.isArray(tindakan) && tindakan.length === 0;

  return (
    <Card style={{ borderRadius: "var(--radius-2xl)", padding: "var(--space-5) var(--space-6)" }}>
      <SectionHeader>Tindakan yang Perlu Dilakukan</SectionHeader>

      {tindakan === null ? (
        <SkeletonChart height="120px" />
      ) : kosong ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-4)",
            border: "2px solid #000000",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-success-bg)",
          }}
        >
          <IkonMS name="task_alt" size={24} fill style={{ color: "#000000" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
            Semua kondisi aman. Tidak ada tindakan mendesak saat ini.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {tindakan.map((item, index) => {
            const gaya = TINGKAT_GAYA[item.tingkat] ?? TINGKAT_GAYA.informasi;
            return (
              <div
                key={`${item.tipe}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  border: "2px solid #000000",
                  borderLeft: `8px solid ${gaya.border}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: gaya.bg,
                  flexWrap: "wrap",
                }}
              >
                <IkonMS name={gaya.ikon} size={22} fill style={{ color: "#000000", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)" }}>
                    {item.judul}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {item.deskripsi}
                  </p>
                </div>
                {item.aksi ? (
                  <button
                    type="button"
                    onClick={() => onNavigate?.(item.aksi)}
                    style={{
                      flexShrink: 0,
                      border: "2px solid #000000",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--color-lime)",
                      color: "#000000",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-bold)",
                      padding: "6px 14px",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Tindak lanjut →
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const medalPeringkat = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank));

// Bagian 3 — Kota yang Perlu Keputusan Sekarang.
function KotaPrioritas({ prioritas, onNavigate }) {
  const rows = (prioritas ?? []).map((item, index) => {
    const aktif = STATUS_AKTIF_KEPUTUSAN.includes(item.statusKeputusanAktif);
    return {
      id: item.kota,
      peringkat: (
        <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-weight-bold)" }}>{medalPeringkat(index + 1)}</span>
      ),
      kota: <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{item.kota}</span>,
      permintaan: formatTonase(item.totalPermintaan),
      hari: `${item.hariTanpaDistribusi} hari`,
      urgensi: (
        <div style={{ minWidth: "120px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", marginBottom: "3px" }}>
            <span>Skor</span>
            <span>{item.skorUrgensi}</span>
          </div>
          <div style={{ height: "8px", borderRadius: "var(--radius-full)", border: "2px solid #000000", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${item.skorUrgensi}%`, backgroundColor: "var(--color-lime)" }} />
          </div>
        </div>
      ),
      status: aktif ? (
        <Badge status={item.statusKeputusanAktif} />
      ) : item.statusKeputusanAktif === "selesai" ? (
        <Badge status="selesai" />
      ) : (
        <span
          style={{
            display: "inline-block",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-bold)",
            border: "2px solid #000000",
            borderRadius: "var(--radius-full)",
            padding: "2px 10px",
            backgroundColor: "var(--color-warning-bg)",
            color: "#000000",
          }}
        >
          Belum ada
        </span>
      ),
      aksi: aktif ? (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>—</span>
      ) : (
        <button
          type="button"
          onClick={() => onNavigate?.("keputusan-distribusi")}
          style={{
            border: "2px solid #000000",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-lime)",
            color: "#000000",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-bold)",
            padding: "5px 14px",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Putuskan
        </button>
      ),
    };
  });

  return (
    <Card>
      <SectionHeader>Kota yang Perlu Keputusan Sekarang</SectionHeader>
      {rows.length > 0 ? (
        <Tabel
          kolom={[
            { key: "peringkat", label: "#" },
            { key: "kota", label: "Nama Kota" },
            { key: "permintaan", label: "Permintaan", numeric: true },
            { key: "hari", label: "Hari Tanpa Distribusi", numeric: true },
            { key: "urgensi", label: "Skor Urgensi" },
            { key: "status", label: "Status" },
            { key: "aksi", label: "Aksi" },
          ]}
          data={rows}
          getRowStyle={(_baris, index) => (index === 0 ? { backgroundColor: "var(--color-pastel-card)" } : undefined)}
        />
      ) : (
        <EmptyState pesan="Belum ada kota yang memerlukan keputusan." />
      )}
    </Card>
  );
}

// Bagian 4 — Keputusan yang Sedang Berjalan.
function KeputusanBerjalan({ berjalan, onBatal }) {
  if (berjalan === null) {
    return (
      <Card>
        <SectionHeader>Keputusan yang Sedang Berjalan</SectionHeader>
        <SkeletonChart height="120px" />
      </Card>
    );
  }
  if (berjalan.length === 0) {
    return (
      <Card>
        <SectionHeader>Keputusan yang Sedang Berjalan</SectionHeader>
        <EmptyState pesan="Belum ada keputusan aktif." />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader>Keputusan yang Sedang Berjalan</SectionHeader>
      <div
        className="app-grid-3"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: "var(--space-4)" }}
      >
        {berjalan.map((item) => {
          const terlewat = item.statusEta === "terlewat";
          const lama = item.durasiHari > 7;
          const borderColor = terlewat ? "var(--color-danger)" : lama ? "var(--color-warning-text)" : "#000000";
          const etaLabel =
            item.statusEta === "tanpa_eta" ? "Tanpa estimasi tiba" : `Estimasi tiba ${formatDate(item.eta)} · ${terlewat ? "Terlewat" : "Tepat waktu"}`;
          return (
            <div
              key={item.id}
              style={{
                border: `2px solid ${borderColor}`,
                borderLeft: `8px solid ${borderColor}`,
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
                backgroundColor: "var(--color-surface)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <strong style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-md)", color: "var(--color-on-surface)" }}>
                  {item.kota}
                </strong>
                <Badge status={item.status} />
              </div>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}>
                {formatTonase(item.volume_tbs)}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Berjalan {item.durasiHari} hari
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: terlewat ? "var(--color-danger-text)" : "var(--color-text-secondary)", fontWeight: terlewat ? "var(--font-weight-bold)" : "var(--font-weight-normal)" }}>
                {etaLabel}
              </span>
              {item.armada ? (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Armada: {item.armada}</span>
              ) : null}
              <button
                type="button"
                onClick={() => onBatal(item)}
                style={{
                  marginTop: "2px",
                  alignSelf: "flex-start",
                  border: "2px solid var(--color-danger)",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-danger-text)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-bold)",
                  padding: "5px 14px",
                  cursor: "pointer",
                }}
              >
                Batalkan
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProyeksiChart({ proyeksi, batasMinimum }) {
  const sig = useMemo(
    () => JSON.stringify([proyeksi.map((p) => p.estimasiStok), batasMinimum]),
    [proyeksi, batasMinimum]
  );

  const buildData = () => ({
    labels: proyeksi.map((p) => p.tanggal.slice(5)),
    datasets: [
      {
        label: "Estimasi Stok",
        data: proyeksi.map((p) => p.estimasiStok),
        borderColor: "#4c6700",
        backgroundColor: "rgba(188, 248, 25, 0.30)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: "Batas Minimum",
        data: proyeksi.map(() => batasMinimum),
        borderColor: "#ba1a1a",
        backgroundColor: "rgba(255, 107, 107, 0.12)",
        borderDash: [6, 6],
        fill: "origin",
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  });

  const { canvasRef, error: chartError, isReady } = useLiveChart({
    sig,
    canDraw: proyeksi.length > 0,
    buildConfig: () => ({
      type: "line",
      data: buildData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationDefaults,
        plugins: {
          legend: { display: true, labels: { font: { family: "Bricolage Grotesque" }, usePointStyle: true, boxWidth: 8 } },
          tooltip: {
            ...chartTooltipDefaults,
            callbacks: { label(context) { return `${formatterAngka.format(context.parsed.y)} ton`; } },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { ...chartTickDefaults } },
          y: {
            beginAtZero: true,
            grid: { ...chartGridDefaults },
            ticks: { ...chartTickDefaults, callback(value) { return `${formatterAngka.format(value)} t`; } },
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

  if (chartError) {
    return <EmptyState pesan={chartError} />;
  }

  return (
    <div style={{ height: "280px" }}>
      {isReady ? null : <SkeletonChart height="280px" />}
      <canvas ref={canvasRef} aria-label="Proyeksi stok 14 hari" style={{ display: isReady ? "block" : "none" }} />
    </div>
  );
}

// Bagian 5 — Proyeksi Stok.
function ProyeksiStok({ proyeksi, onMintaStok }) {
  if (!proyeksi) {
    return (
      <Card>
        <SectionHeader>Stok Bertahan Berapa Hari Lagi</SectionHeader>
        <SkeletonChart height="280px" />
      </Card>
    );
  }
  const batasMinimum = Math.round(proyeksi.rataPermintaanHarian * 7);
  const perluTambah = proyeksi.hariHabis !== null && proyeksi.hariHabis < 14;

  return (
    <Card>
      <SectionHeader>Stok Bertahan Berapa Hari Lagi</SectionHeader>
      <div
        className="app-grid-2"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(160px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}
      >
        <div style={{ border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-4)", backgroundColor: "var(--color-pastel-card)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>
            Rata-rata Permintaan Harian
          </p>
          <p style={{ margin: "4px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>
            {formatTonase(proyeksi.rataPermintaanHarian)}
          </p>
        </div>
        <div style={{ border: "2px solid #000000", borderRadius: "var(--radius-lg)", padding: "var(--space-4)", backgroundColor: perluTambah ? "var(--color-danger-bg)" : "var(--color-pastel-card)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>
            Estimasi Stok Habis
          </p>
          <p style={{ margin: "4px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: perluTambah ? "var(--color-danger-text)" : "var(--color-on-surface)" }}>
            {proyeksi.hariHabis !== null ? `${proyeksi.hariHabis} hari` : "Tak terukur"}
          </p>
        </div>
      </div>

      <ProyeksiChart proyeksi={proyeksi.proyeksi} batasMinimum={batasMinimum} />

      {perluTambah ? (
        <div
          style={{
            marginTop: "var(--space-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            border: "2px solid #000000",
            borderLeft: "8px solid var(--color-danger)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-3) var(--space-4)",
            backgroundColor: "var(--color-danger-bg)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
            <IkonMS name="warning" size={20} fill style={{ color: "#000000" }} />
            Stok diperkirakan habis dalam {proyeksi.hariHabis} hari.
          </span>
          <button
            type="button"
            onClick={onMintaStok}
            style={{
              border: "2px solid #000000",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-lime)",
              color: "#000000",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-bold)",
              padding: "6px 14px",
              boxShadow: "var(--shadow-sm)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Minta Tambah Stok ke Admin
          </button>
        </div>
      ) : null}
    </Card>
  );
}

// ── Bagian 6 — Kinerja vs Target (management by objectives) ─────────────────
// Realisasi KPI tidak berdiri sendiri: selalu dibandingkan dengan target yang
// ditetapkan manajer (/mis/target-kpi), dan tiap kartu bisa diklik untuk
// drill-down rincian pembentuk angkanya.

const STATUS_TARGET_GAYA = {
  tercapai: { label: "Tercapai", bg: "var(--color-lime)", warna: "#000000" },
  meleset: { label: "Meleset", bg: "var(--color-danger-bg)", warna: "var(--color-danger-text)" },
  "tak-terukur": { label: "Tak terukur", bg: "var(--color-surface)", warna: "var(--color-text-muted)" },
};

function ChipTargetStatus({ status }) {
  const gaya = STATUS_TARGET_GAYA[status] ?? STATUS_TARGET_GAYA["tak-terukur"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "2px solid #000000",
        borderRadius: "var(--radius-full)",
        padding: "2px 10px",
        backgroundColor: gaya.bg,
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--font-weight-bold)",
        color: gaya.warna,
      }}
    >
      {gaya.label}
    </span>
  );
}

function KartuKpi({ label, nilai, targetLabel, status, ikon, onClick }) {
  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } } : undefined}
      style={{
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        minHeight: "148px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>
          {label}
        </span>
        <span style={{ width: "36px", height: "36px", flexShrink: 0, display: "grid", placeItems: "center", border: "2px solid #000000", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-pastel)" }}>
          <IkonMS name={ikon} size={20} style={{ color: "#000000" }} />
        </span>
      </div>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-3xl)", fontWeight: "var(--font-weight-bold)", letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--color-on-surface)" }}>
        {nilai}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{targetLabel}</span>
        {status ? <ChipTargetStatus status={status} /> : null}
      </div>
      {onClick ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
          <IkonMS name="search_insights" size={14} />
          Klik untuk rincian
        </span>
      ) : null}
    </Card>
  );
}

function KinerjaVsTarget({ kpi, onDrill, onAturTarget }) {
  if (!kpi) {
    return <SkeletonChart height="148px" />;
  }
  const { target } = kpi;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
        <div>
          <SectionHeader>Kinerja vs Target</SectionHeader>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Realisasi indikator kinerja dibandingkan dengan target yang Anda tetapkan. Klik kartu untuk menelusuri pembentuk angkanya.
          </p>
        </div>
        <Tombol label="Atur Target" variant="sekunder" onClick={onAturTarget} />
      </div>
      <div className="app-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(170px, 1fr))", gap: "var(--space-3)" }}>
        <KartuKpi
          label="Tingkat Pemenuhan"
          nilai={`${kpi.tingkatPemenuhan}%`}
          targetLabel={`Target: ≥ ${target.targetPemenuhan}%`}
          status={kpi.status.pemenuhan}
          ikon="task_alt"
          onClick={() => onDrill("pemenuhan")}
        />
        <KartuKpi
          label="Rata Waktu Kirim"
          nilai={kpi.rataWaktuPengiriman !== null ? `${kpi.rataWaktuPengiriman} hari` : "—"}
          targetLabel={`Target: ≤ ${target.targetWaktuKirim} hari`}
          status={kpi.status.waktuKirim}
          ikon="local_shipping"
          onClick={() => onDrill("waktuKirim")}
        />
        <KartuKpi
          label="Utilisasi Kapasitas"
          nilai={`${kpi.utilisasiKapasitas}%`}
          targetLabel={`Target: ≥ ${target.targetUtilisasi}%`}
          status={kpi.status.utilisasi}
          ikon="speed"
          onClick={() => onDrill("utilisasi")}
        />
        <KartuKpi
          label="Keputusan Aktif"
          nilai={String(kpi.keputusanAktif)}
          targetLabel={`Eskalasi bila menunggu > ${target.maxHariEskalasi} hari`}
          ikon="pending_actions"
        />
      </div>
    </Card>
  );
}

// ── Bagian 7 — Tren Kinerja (riwayat snapshot KPI harian) ────────────────────
function TrenKinerjaChart({ riwayat, targetPemenuhan }) {
  const sig = useMemo(
    () => JSON.stringify([riwayat.map((r) => [r.tingkatPemenuhan, r.utilisasiKapasitas]), targetPemenuhan]),
    [riwayat, targetPemenuhan]
  );

  const buildData = () => ({
    labels: riwayat.map((r) => r.tanggal.slice(5)),
    datasets: [
      {
        label: "Tingkat Pemenuhan (%)",
        data: riwayat.map((r) => r.tingkatPemenuhan),
        borderColor: "#4c6700",
        backgroundColor: "rgba(188, 248, 25, 0.30)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: "Utilisasi Kapasitas (%)",
        data: riwayat.map((r) => r.utilisasiKapasitas),
        borderColor: "#1a56ba",
        backgroundColor: "rgba(26, 86, 186, 0.10)",
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      },
      ...(targetPemenuhan
        ? [
            {
              label: "Target Pemenuhan",
              data: riwayat.map(() => targetPemenuhan),
              borderColor: "#ba1a1a",
              borderDash: [6, 6],
              pointRadius: 0,
              borderWidth: 2,
              fill: false,
            },
          ]
        : []),
    ],
  });

  const { canvasRef, error: chartError, isReady } = useLiveChart({
    sig,
    canDraw: riwayat.length > 1,
    buildConfig: () => ({
      type: "line",
      data: buildData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationDefaults,
        plugins: {
          legend: { display: true, labels: { font: { family: "Bricolage Grotesque" }, usePointStyle: true, boxWidth: 8 } },
          tooltip: {
            ...chartTooltipDefaults,
            callbacks: { label(context) { return `${context.dataset.label}: ${formatterAngka.format(context.parsed.y)}${context.dataset.label.includes("%") || context.dataset.label.includes("Target") ? "%" : ""}`; } },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { ...chartTickDefaults } },
          y: {
            beginAtZero: true,
            max: 100,
            grid: { ...chartGridDefaults },
            ticks: { ...chartTickDefaults, callback(value) { return `${value}%`; } },
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

  if (chartError) {
    return <EmptyState pesan={chartError} />;
  }

  return (
    <div style={{ height: "260px" }}>
      {isReady ? null : <SkeletonChart height="260px" />}
      <canvas ref={canvasRef} aria-label="Tren indikator kinerja harian" style={{ display: isReady ? "block" : "none" }} />
    </div>
  );
}

function TrenKinerja({ riwayat, targetPemenuhan }) {
  if (!riwayat) {
    return <SkeletonChart height="260px" />;
  }
  const eksporRiwayat = () =>
    downloadCsv(
      "riwayat-indikator-kinerja.csv",
      riwayat.map((item) => ({
        tanggal: item.tanggal,
        tingkatPemenuhan: item.tingkatPemenuhan,
        utilisasiKapasitas: item.utilisasiKapasitas,
        keputusanAktif: item.keputusanAktif,
        rataWaktuPengiriman: item.rataWaktuPengiriman ?? "",
        stokTbs: item.stokTbs,
        totalPermintaanTon: item.totalPermintaanTon,
      })),
      [
        { key: "tanggal", label: "Tanggal" },
        { key: "tingkatPemenuhan", label: "Tingkat Pemenuhan (%)" },
        { key: "utilisasiKapasitas", label: "Utilisasi Kapasitas (%)" },
        { key: "keputusanAktif", label: "Keputusan Aktif" },
        { key: "rataWaktuPengiriman", label: "Rata Waktu Kirim (hari)" },
        { key: "stokTbs", label: "Stok TBS (ton)" },
        { key: "totalPermintaanTon", label: "Total Permintaan (ton)" },
      ]
    );

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <SectionHeader>Tren Kinerja</SectionHeader>
        <Tombol label="Ekspor CSV" variant="sekunder" onClick={eksporRiwayat} disabled={riwayat.length === 0} />
      </div>
      <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        Indikator kinerja direkam otomatis setiap hari — grafik ini menjawab apakah kinerja distribusi membaik
        dari waktu ke waktu, dibandingkan garis target.
      </p>
      {riwayat.length > 1 ? (
        <TrenKinerjaChart riwayat={riwayat} targetPemenuhan={targetPemenuhan} />
      ) : (
        <EmptyState pesan="Riwayat kinerja belum cukup untuk menampilkan tren (butuh minimal 2 hari)." />
      )}
    </Card>
  );
}

// ── Drill-down KPI: rincian pembentuk angka, dihitung dari cache store ────────
const DRILL_JUDUL = {
  pemenuhan: "Rincian Tingkat Pemenuhan per Kota",
  waktuKirim: "Rincian Siklus Pengiriman Selesai",
  utilisasi: "Rincian Utilisasi Kapasitas per Kota",
};

function ModalDrillKpi({ jenis, onTutup }) {
  const { permintaan = [], keputusan = [], daftarKota = [] } = store.getState();

  let konten = null;
  if (jenis === "pemenuhan") {
    const detail = computePemenuhanPerKota(permintaan, keputusan);
    konten = detail.length > 0 ? (
      <Tabel
        kolom={[
          { key: "kota", label: "Kota" },
          { key: "totalPermintaan", label: "Permintaan (ton)", numeric: true },
          { key: "alokasi", label: "Alokasi (ton)", numeric: true },
          { key: "persen", label: "Pemenuhan", numeric: true },
        ]}
        data={detail.map((item) => ({
          id: item.kota,
          kota: item.kota,
          totalPermintaan: formatTonase(item.totalPermintaan),
          alokasi: formatTonase(item.alokasi),
          persen: (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: item.persen < 50 ? "var(--color-danger-text)" : item.persen < 100 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
              {item.persen}%
            </span>
          ),
        }))}
      />
    ) : (
      <EmptyState pesan="Belum ada data permintaan untuk dirinci." />
    );
  } else if (jenis === "waktuKirim") {
    const detail = computeSiklusDetail(keputusan);
    konten = detail.length > 0 ? (
      <Tabel
        kolom={[
          { key: "kota", label: "Kota" },
          { key: "volume", label: "Volume (ton)", numeric: true },
          { key: "siklusJam", label: "Siklus (jam)", numeric: true },
          { key: "eta", label: "Estimasi Tiba" },
          { key: "tepat", label: "Ketepatan" },
        ]}
        data={detail.map((item) => ({
          id: item.id,
          kota: item.kota,
          volume: formatTonase(item.volume),
          siklusJam: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{item.siklusJam}</span>,
          eta: item.eta ? formatDate(item.eta) : "—",
          tepat:
            item.tepatWaktu === null ? (
              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Tanpa estimasi</span>
            ) : item.tepatWaktu ? (
              <span style={{ color: "var(--color-success-text)", fontSize: "var(--text-xs)", fontWeight: 600 }}>Tepat waktu</span>
            ) : (
              <span style={{ color: "var(--color-danger-text)", fontSize: "var(--text-xs)", fontWeight: 600 }}>Terlambat</span>
            ),
        }))}
      />
    ) : (
      <EmptyState pesan="Belum ada pengiriman selesai dengan data waktu lengkap." />
    );
  } else if (jenis === "utilisasi") {
    const alokasiByKota = keputusan.reduce((map, item) => {
      map.set(item.kota_tujuan, (map.get(item.kota_tujuan) || 0) + (Number(item.volume_tbs) || 0));
      return map;
    }, new Map());
    const detail = daftarKota
      .map((kota) => {
        const alokasi = alokasiByKota.get(kota.nama) || 0;
        const persen = kota.kapasitas > 0 ? Math.min(100, Math.round((alokasi / kota.kapasitas) * 100)) : 0;
        return { kota: kota.nama, kapasitas: kota.kapasitas, alokasi, persen };
      })
      .sort((a, b) => b.persen - a.persen);
    konten = detail.length > 0 ? (
      <Tabel
        kolom={[
          { key: "kota", label: "Kota" },
          { key: "kapasitas", label: "Kapasitas (ton)", numeric: true },
          { key: "alokasi", label: "Alokasi (ton)", numeric: true },
          { key: "persen", label: "Utilisasi", numeric: true },
        ]}
        data={detail.map((item) => ({
          id: item.kota,
          kota: item.kota,
          kapasitas: formatTonase(item.kapasitas),
          alokasi: formatTonase(item.alokasi),
          persen: (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: item.persen >= 90 ? "var(--color-danger-text)" : "var(--color-on-surface)" }}>
              {item.persen}%
            </span>
          ),
        }))}
      />
    ) : (
      <EmptyState pesan="Belum ada kota terdaftar." />
    );
  }

  return (
    <Modal
      judul={DRILL_JUDUL[jenis] ?? "Rincian Indikator Kinerja"}
      onTutup={onTutup}
      konten={<div style={{ maxHeight: "60vh", overflowY: "auto" }}>{konten}</div>}
    />
  );
}

// ── Modal Atur Target KPI ────────────────────────────────────────────────────
const FIELD_TARGET = [
  { key: "targetPemenuhan", label: "Target tingkat pemenuhan (%)", min: 1, max: 100 },
  { key: "targetWaktuKirim", label: "Target rata-rata waktu kirim (hari)", min: 0.5, max: 30, step: 0.5 },
  { key: "targetUtilisasi", label: "Target utilisasi kapasitas (%)", min: 1, max: 100 },
  { key: "minHariPasokan", label: "Hari pasokan minimum sebelum peringatan", min: 1, max: 90 },
  { key: "maxHariEskalasi", label: "Batas hari keputusan menunggu sebelum eskalasi", min: 1, max: 30 },
];

function ModalAturTarget({ target, onTutup, onTersimpan }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELD_TARGET.map((f) => [f.key, String(target[f.key] ?? "")]))
  );
  const [isSaving, setIsSaving] = useState(false);

  const simpan = async () => {
    setIsSaving(true);
    try {
      const body = Object.fromEntries(FIELD_TARGET.map((f) => [f.key, Number(form[f.key])]));
      await setTargetKpi(body);
      showToast({ type: "success", message: "Target kinerja berhasil diperbarui." });
      onTersimpan();
    } catch (error) {
      showToast({ type: "error", message: error.message || "Gagal menyimpan target kinerja." });
      setIsSaving(false);
    }
  };

  return (
    <Modal
      judul="Atur Target Kinerja"
      onTutup={onTutup}
      konten={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Target ini menjadi acuan seluruh indikator: status indikator kinerja, ambang peringatan stok, dan eskalasi
            keputusan. Perubahan tercatat di riwayat aktivitas.
          </p>
          {FIELD_TARGET.map((f) => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>
                {f.label}
              </span>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step ?? 1}
                value={form[f.key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [f.key]: event.target.value }))}
                style={{ width: "100%", maxWidth: "220px", border: "2px solid #000000", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: "10px 14px", outline: "none", boxShadow: "var(--shadow-sm)", boxSizing: "border-box" }}
              />
            </label>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
            <Tombol label="Batal" variant="sekunder" onClick={onTutup} disabled={isSaving} />
            <Tombol label={isSaving ? "Menyimpan..." : "Simpan Target"} onClick={simpan} disabled={isSaving} />
          </div>
        </div>
      }
    />
  );
}

function DashboardManajer({ userAktif, onNavigate }) {
  const [situasi, setSituasi] = useState(null);
  const [tindakan, setTindakan] = useState(null);
  const [prioritas, setPrioritas] = useState(null);
  const [berjalan, setBerjalan] = useState(null);
  const [proyeksi, setProyeksi] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [riwayatKpi, setRiwayatKpi] = useState(null);
  const [batalTarget, setBatalTarget] = useState(null);
  const [drillKpi, setDrillKpi] = useState(null);
  const [aturTarget, setAturTarget] = useState(false);

  const muat = useCallback(async () => {
    // allSettled: tiap panel muat mandiri — satu endpoint gagal (mis. 404
    // sebelum backend di-restart, atau 401 sesi habis) tidak lagi membuat
    // seluruh dashboard kosong. Setter hanya dipanggil untuk yang berhasil.
    const [s, t, p, b, pr, k, rk] = await Promise.allSettled([
      getMisSituasiHariIni(),
      getMisTindakanMendesak(),
      getMisRekomendasiPrioritas(),
      getMisKeputusanBerjalan(),
      getMisProyeksiStok(),
      getKpi(),
      getRiwayatKpi(30),
    ]);
    if (s.status === "fulfilled") setSituasi(s.value);
    if (t.status === "fulfilled") setTindakan(t.value);
    if (p.status === "fulfilled") setPrioritas(p.value);
    if (b.status === "fulfilled") setBerjalan(b.value);
    if (pr.status === "fulfilled") setProyeksi(pr.value);
    if (k.status === "fulfilled") setKpi(k.value);
    if (rk.status === "fulfilled") setRiwayatKpi(rk.value);
  }, []);

  useEffect(() => {
    muat();
    const id = window.setInterval(muat, 8000);
    return () => window.clearInterval(id);
  }, [muat]);

  // Sinkronisasi notifikasi cerdas sekali saat dashboard dimuat, lalu segarkan
  // daftar notifikasi agar badge header mencerminkan hasilnya.
  useEffect(() => {
    (async () => {
      try {
        await sinkronNotifikasiMis();
        await store.loadNotifikasi();
      } catch {
        // diamkan; sinkronisasi notifikasi opsional
      }
    })();
  }, []);

  const konfirmasiBatal = async () => {
    if (!batalTarget) {
      return;
    }
    try {
      await store.removeKeputusan(batalTarget.id);
      setBatalTarget(null);
      muat();
    } catch {
      // runMutation sudah menampilkan pesan error server via Toast.
    }
  };

  const mintaTambahStok = () => {
    showToast({ type: "success", message: "Permintaan penambahan stok telah dikirim ke Admin." });
  };

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Informasi keputusan distribusi harian untuk Manajer."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <HeroStrip nama={userAktif?.nama} role={userAktif?.role} />

        <SituasiHariIni situasi={situasi} />
        <KinerjaVsTarget kpi={kpi} onDrill={setDrillKpi} onAturTarget={() => setAturTarget(true)} />
        <TrenKinerja riwayat={riwayatKpi} targetPemenuhan={kpi?.target?.targetPemenuhan} />
        <TindakanMendesakPanel tindakan={tindakan} onNavigate={onNavigate} />
        <KotaPrioritas prioritas={prioritas} onNavigate={onNavigate} />
        <KeputusanBerjalan berjalan={berjalan} onBatal={setBatalTarget} />
        <ProyeksiStok proyeksi={proyeksi} onMintaStok={mintaTambahStok} />
      </div>

      {drillKpi ? <ModalDrillKpi jenis={drillKpi} onTutup={() => setDrillKpi(null)} /> : null}

      {aturTarget && kpi ? (
        <ModalAturTarget
          target={kpi.target}
          onTutup={() => setAturTarget(false)}
          onTersimpan={() => {
            setAturTarget(false);
            muat();
          }}
        />
      ) : null}

      {batalTarget ? (
        <Modal
          judul="Batalkan keputusan distribusi"
          onTutup={() => setBatalTarget(null)}
          konten={
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Batalkan keputusan distribusi ke{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{batalTarget.kota}</strong> sebesar{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{formatTonase(batalTarget.volume_tbs)}</strong>?
                Volume akan dikembalikan ke stok TBS.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <Tombol label="Tidak" variant="sekunder" onClick={() => setBatalTarget(null)} />
                <Tombol label="Ya, Batalkan" variant="bahaya" onClick={konfirmasiBatal} />
              </div>
            </div>
          }
        />
      ) : null}
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

  // ── Ringkasan operasional (MIS) untuk Tim Logistik ──
  const todayKeyLogistik = getLocalDateKey();
  const bebanKerja = useMemo(() => {
    const aktif = sortedKeputusan.filter((item) => item.status === "menunggu" || item.status === "dalam-pengiriman").length;
    const selesaiHariIni = sortedKeputusan.filter(
      (item) => item.status === "selesai" && item.waktu_selesai && getLocalDateKey(new Date(item.waktu_selesai)) === todayKeyLogistik
    ).length;
    const etaTerlewat = computeSlaBreaches(keputusan).filter((item) => item.jenis === "melewati-eta").length;
    return { aktif, selesaiHariIni, perluKonfirmasi: ringkasanStatus.menunggu, etaTerlewat };
  }, [sortedKeputusan, keputusan, ringkasanStatus, todayKeyLogistik]);

  // Prioritas kerja: ETA terlewat paling atas (merah), lalu ETA terdekat.
  const prioritasKerja = useMemo(() => {
    const nilaiUrut = (item) => {
      if (!item.eta) return Number.MAX_SAFE_INTEGER;
      return parseDate(item.eta).getTime();
    };
    return sortedKeputusan
      .filter((item) => item.status === "menunggu" || item.status === "dalam-pengiriman")
      .map((item) => ({ ...item, terlewat: item.eta ? parseDate(item.eta) < parseDate(todayKeyLogistik) : false }))
      .sort((a, b) => {
        if (a.terlewat !== b.terlewat) return a.terlewat ? -1 : 1;
        return nilaiUrut(a) - nilaiUrut(b);
      })
      .slice(0, 6);
  }, [sortedKeputusan, todayKeyLogistik]);

  const statusRows = sortedKeputusan.map((item) => {
    const stepIndex = statusUrutan.indexOf(item.status);

    return {
      id: item.id,
      kotaTujuan: item.kota_tujuan,
      volume: formatTonase(item.volume_tbs),
      armada: item.armada ? `${item.armada}${item.eta ? ` · Estimasi tiba ${formatDate(item.eta)}` : ""}` : "-",
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
                  backgroundColor: dotIndex <= stepIndex ? "var(--color-lime)" : "transparent",
                  border: "2px solid #000000",
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
        nextErrors.eta = "Estimasi tiba wajib dipilih saat status Dalam Pengiriman.";
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

        {/* Ringkasan operasional (MIS): beban kerja hari ini + SLA. */}
        <div
          className="app-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: "var(--space-3)" }}
        >
          {[
            { label: "Total Aktif", nilai: bebanKerja.aktif, warna: "var(--color-on-surface)" },
            { label: "Selesai Hari Ini", nilai: bebanKerja.selesaiHariIni, warna: "var(--color-success-text)" },
            { label: "Perlu Konfirmasi", nilai: bebanKerja.perluKonfirmasi, warna: "var(--color-warning-text)" },
            { label: "Estimasi Tiba Terlewat", nilai: bebanKerja.etaTerlewat, warna: bebanKerja.etaTerlewat > 0 ? "var(--color-danger-text)" : "var(--color-on-surface)" },
          ].map((box) => (
            <div
              key={box.label}
              style={{
                border: "2px solid #000000",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-3) var(--space-4)",
                backgroundColor: box.label === "Estimasi Tiba Terlewat" && bebanKerja.etaTerlewat > 0 ? "var(--color-danger-bg)" : "var(--color-surface)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>{box.label}</p>
              <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: box.warna }}>{formatterAngka.format(box.nilai)}</p>
            </div>
          ))}
        </div>

        {prioritasKerja.length > 0 ? (
          <Card>
            <SectionHeader>Prioritas Kerja (Estimasi Tiba Terdekat)</SectionHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {prioritasKerja.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    border: "2px solid #000000",
                    borderLeft: `8px solid ${item.terlewat ? "var(--color-danger)" : "var(--color-lime)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-2) var(--space-4)",
                    backgroundColor: item.terlewat ? "var(--color-danger-bg)" : "var(--color-surface)",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ flex: 1, minWidth: "140px", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                    {item.kota_tujuan} · {formatTonase(item.volume_tbs)}
                  </span>
                  <Badge status={item.status} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: item.terlewat ? "var(--font-weight-bold)" : "var(--font-weight-normal)", color: item.terlewat ? "var(--color-danger-text)" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {item.eta ? `${item.terlewat ? "Terlewat" : "Estimasi tiba"} ${formatDate(item.eta)}` : "Tanpa estimasi tiba"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openStatusModal(item)}
                    style={{
                      border: "2px solid #000000",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--color-lime)",
                      color: "#000000",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-bold)",
                      padding: "5px 14px",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Update Status
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

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
              borderLeft: "8px solid var(--color-lime)",
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

        {statusRows.length > 0 ? (
          /* Mini kanban 3 kolom ala Stitch dashboard_logistik. */
          <div
            className="app-grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(200px, 1fr))",
              gap: "var(--space-4)",
              alignItems: "start",
            }}
          >
            {statusUrutan.map((statusKey) => {
              const kolomWarna = {
                menunggu: { dot: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
                "dalam-pengiriman": { dot: "var(--color-info-text)", bg: "var(--color-info-bg)" },
                selesai: { dot: "var(--color-success-text)", bg: "var(--color-success-bg)" },
              }[statusKey];
              const labelKolom = { menunggu: "Menunggu", "dalam-pengiriman": "Dalam Pengiriman", selesai: "Selesai" }[statusKey];
              const itemsKolom = sortedKeputusan.filter((item) => item.status === statusKey);

              return (
                <div
                  key={statusKey}
                  style={{
                    backgroundColor: "var(--color-surface-container-low)",
                    border: "2px solid #000000",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                    padding: "var(--space-3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    minHeight: "160px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px" }}>
                    <span
                      className={statusKey !== "selesai" ? "animate-pulse-dot" : undefined}
                      style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: kolomWarna.dot }}
                    />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                      {labelKolom}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", backgroundColor: kolomWarna.bg, color: kolomWarna.dot, border: "2px solid #000000", borderRadius: "var(--radius-full)", padding: "2px 8px" }}>
                      {itemsKolom.length}
                    </span>
                  </div>

                  {itemsKolom.length === 0 ? (
                    <p style={{ margin: 0, padding: "12px 8px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-disabled)" }}>
                      Tidak ada kiriman.
                    </p>
                  ) : (
                    itemsKolom.map((item) => (
                      <div
                        key={item.id}
                        className="app-card app-card-hoverable"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          borderRadius: "var(--radius-lg)",
                          padding: "var(--space-4)",
                          boxShadow: "var(--shadow-sm)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <strong style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", color: "var(--color-on-surface)" }}>
                            {item.kota_tujuan}
                          </strong>
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
                            {formatTonase(item.volume_tbs)}
                          </span>
                        </div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>
                          {item.armada ? `${item.armada}${item.eta ? ` · Estimasi tiba ${formatDate(item.eta)}` : ""}` : "Armada belum ditetapkan"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openStatusModal(item)}
                          style={{
                            marginTop: "2px",
                            alignSelf: "flex-start",
                            border: "2px solid #000000",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--color-lime)",
                            color: "#000000",
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-weight-bold)",
                            padding: "5px 14px",
                            boxShadow: "var(--shadow-sm)",
                            cursor: "pointer",
                            transition: "background-color var(--transition-fast)",
                          }}
                        >
                          Perbarui Status
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState pesan="Belum ada data status distribusi untuk ditampilkan." />
          </Card>
        )}
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
                  border: "2px solid #000000",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: isSelectFocused ? "var(--color-pastel)" : "#ffffff",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  padding: "10px 14px",
                  outline: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "background-color var(--transition-fast)",
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
                          ? "2px solid var(--color-danger)"
                          : "2px solid #000000",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "#ffffff",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "10px 14px",
                        outline: "none",
                        boxShadow: "var(--shadow-sm)",
                        boxSizing: "border-box",
                      }}
                    />
                    {modalErrors.armada ? <p style={errorStyle}>{modalErrors.armada}</p> : null}
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Estimasi Tiba
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
                          ? "2px solid var(--color-danger)"
                          : "2px solid #000000",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "#ffffff",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        padding: "10px 14px",
                        outline: "none",
                        boxShadow: "var(--shadow-sm)",
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
    store.loadKpi();
    store.loadRekomendasi();
    store.loadActivityLog();
  }, []);

  // Panel kesehatan sistem Admin butuh daftar akun; loadAkun aman untuk non-Admin
  // (mengembalikan array kosong pada 403), tetapi hanya dipanggil untuk Admin.
  useEffect(() => {
    if (snapshot.roleAktif === "Admin") {
      store.loadAkun();
    }
  }, [snapshot.roleAktif]);

  const { roleAktif, permintaan, keputusan, activityLog, userAktif, daftarKota, stokTbs, kpi, rekomendasi, daftarAkun } = snapshot;

  const contentByRole = {
    Admin: (
      <DashboardAdmin
        permintaan={permintaan}
        keputusan={keputusan}
        activityLog={activityLog}
        userAktif={userAktif}
        daftarKota={daftarKota}
        stokTbs={stokTbs}
        daftarAkun={daftarAkun}
        onNavigate={onNavigate}
      />
    ),
    "Manajer Distribusi": <DashboardManajer userAktif={userAktif} onNavigate={onNavigate} />,
    "Tim Logistik": <DashboardLogistik keputusan={keputusan} userAktif={userAktif} />,
  };

  return (
    contentByRole[roleAktif] ?? (
      <EmptyState pesan="Role aktif belum dikenali. Pilih role lain pada header aplikasi." />
    )
  );
}

export default Dashboard;
