import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import Card from "../components/Card";
import MetricCard from "../components/MetricCard";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionHeader from "../components/SectionHeader";
import Tabel from "../components/Tabel";
import Tombol from "../components/Tombol";
import { showToast } from "../components/Toast";
import { SkeletonChart } from "../components/Skeleton";
import useLiveChart from "../hooks/useLiveChart";
import store from "../store";
import {
  CHART_PALETTE,
  chartAnimationDefaults,
  chartGridDefaults,
  chartLegendDefaults,
  chartTickDefaults,
  chartTooltipDefaults,
  withOpacity,
} from "../utils/chartDefaults";
import {
  getLocalDateKey,
  getPeriodRange,
  isDateInRange,
  parseDate,
} from "../utils/distribusi";

const HARI_MS = 24 * 60 * 60 * 1000;
import { formatDate, formatTonase } from "../utils/format";

const roleOptions = ["Manajer Distribusi", "Tim Logistik"];

const periodeOptions = [
  ["semua", "Semua"],
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
        backgroundColor: "#ffffff",
        border: "2px solid #000000",
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
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
              padding: "5px 12px",
              borderRadius: "var(--radius-full)",
              border: active ? "2px solid #000000" : "2px solid transparent",
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-bold)",
              color: active ? "#000000" : "var(--color-text-muted)",
              backgroundColor: active ? "var(--color-lime)" : "transparent",
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
  const sig = useMemo(
    () => JSON.stringify({ labels, ds: datasets.map((d) => [d.label, d.data]) }),
    [labels, datasets]
  );

  const buildData = () => ({
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
  });

  const { canvasRef, error: chartError, isReady: isChartReady } = useLiveChart({
    sig,
    canDraw: labels.length > 0 && datasets.length > 0,
    buildConfig: () => ({
      type: "line",
      data: buildData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationDefaults,
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
    }),
    applyData: (chart) => {
      const next = buildData();
      chart.data.labels = next.labels;
      chart.data.datasets = next.datasets;
    },
  });

  return (
    <Card style={{ minHeight: "420px", animationDelay: "60ms" }}>
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
  const total = counts.menunggu + counts["dalam-pengiriman"] + counts.selesai;
  const sig = useMemo(
    () => JSON.stringify([counts.menunggu, counts["dalam-pengiriman"], counts.selesai]),
    [counts]
  );

  const buildData = () => ({
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
  });

  const { canvasRef, error: chartError, isReady: isChartReady } = useLiveChart({
    sig,
    canDraw: total > 0,
    buildConfig: () => ({
      type: "doughnut",
      data: buildData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationDefaults,
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
    }),
    applyData: (chart) => {
      const next = buildData();
      chart.data.labels = next.labels;
      chart.data.datasets = next.datasets;
    },
  });

  return (
    <Card style={{ minHeight: "420px", animationDelay: "60ms" }}>
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

function RingkasanAI({ periode }) {
  const [ringkasan, setRingkasan] = useState("");
  const [ringkasanError, setRingkasanError] = useState("");
  const [isMembuatRingkasan, setIsMembuatRingkasan] = useState(false);

  // Ringkasan terikat pada periode saat dibuat — reset saat periode berganti
  // agar narasi periode lama tidak menyesatkan pembaca.
  useEffect(() => {
    setRingkasan("");
    setRingkasanError("");
  }, [periode]);

  const handleBuatRingkasan = async () => {
    setIsMembuatRingkasan(true);
    setRingkasanError("");
    try {
      const hasil = await store.buatRingkasanLaporan(periode);
      setRingkasan(hasil?.ringkasan ?? "");
    } catch (error) {
      setRingkasanError(error.message || "Gagal membuat ringkasan. Coba lagi.");
    } finally {
      setIsMembuatRingkasan(false);
    }
  };

  return (
    <Card style={{ animationDelay: "40ms" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <SectionHeader>
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "6px" }}
          >
            auto_awesome
          </span>
          Ringkasan AI
        </SectionHeader>
        <Tombol
          label={ringkasan ? "Buat Ulang" : "Buat Ringkasan"}
          variant="sekunder"
          onClick={handleBuatRingkasan}
          isLoading={isMembuatRingkasan}
        />
      </div>

      {ringkasanError ? (
        <p
          style={{
            margin: 0,
            color: "var(--color-danger)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
          }}
        >
          {ringkasanError}
        </p>
      ) : ringkasan ? (
        <div style={{ animation: "fadeInUp 300ms var(--ease-smooth) both" }}>
          {ringkasan.split(/\n{2,}/).map((paragraf, index) => (
            <p
              key={index}
              style={{
                margin: index === 0 ? 0 : "0.75rem 0 0",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.7,
              }}
            >
              {paragraf}
            </p>
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
          }}
        >
          {isMembuatRingkasan
            ? "AI sedang menganalisis data laporan periode ini…"
            : "Buat ringkasan naratif otomatis dari data laporan periode terpilih dengan bantuan AI."}
        </p>
      )}
    </Card>
  );
}

function Laporan({ onNavigate }) {
  const [snapshot, setSnapshot] = useState(store.getState());
  // Default "semua" agar laporan langsung terisi — filter minggu/bulan yang
  // ketat sebelumnya membuat keputusan bertanggal lama tersaring habis dan
  // halaman tampak kosong (laporan Tim Logistik "tidak ada laporan masuk").
  const [periode, setPeriode] = useState("semua");

  useEffect(() => {
    const unsubscribe = store.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  // Role-differentiated reports + CSV export read keputusan/riwayatKeputusan/
  // permintaan from the cache below — load all three on mount so the page
  // renders fresh server data with no manual refresh.
  useEffect(() => {
    store.loadKeputusan();
    store.loadRiwayatKeputusan();
    store.loadPermintaan();
    store.loadKota();
  }, []);

  const [anomaliKota, setAnomaliKota] = useState("");
  const daftarKota = useMemo(() => snapshot.daftarKota ?? [], [snapshot.daftarKota]);

  const roleAktif = roleOptions.includes(snapshot.roleAktif)
    ? snapshot.roleAktif
    : "Manajer Distribusi";

  const isTimLogistik = roleAktif === "Tim Logistik";

  // range null = "semua periode" (tanpa penyaringan tanggal).
  const range = useMemo(
    () => (periode === "semua" ? null : getPeriodRange(periode)),
    [periode]
  );

  const filteredRiwayat = useMemo(
    () =>
      [...(snapshot.riwayatKeputusan ?? [])]
        .filter((item) => !range || isDateInRange(item.tanggal_keputusan, range))
        .sort(
          (first, second) =>
            parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
        ),
    [range, snapshot.riwayatKeputusan]
  );

  const filteredPermintaan = useMemo(
    () =>
      (snapshot.permintaan ?? []).filter(
        (item) => !range || isDateInRange(item.tanggal_permintaan, range)
      ),
    [range, snapshot.permintaan]
  );

  const filteredKeputusan = useMemo(
    () =>
      [...(snapshot.keputusan ?? [])]
        .filter((item) => !range || isDateInRange(item.tanggal_keputusan, range))
        .sort(
          (first, second) =>
            parseDate(second.tanggal_keputusan) - parseDate(first.tanggal_keputusan)
        ),
    [range, snapshot.keputusan]
  );

  const statusCounts = useMemo(() => {
    const counts = { menunggu: 0, "dalam-pengiriman": 0, selesai: 0 };
    filteredKeputusan.forEach((item) => {
      // keputusan never contains "dibatalkan" — removeKeputusan() strips
      // cancelled entries out of state.keputusan (see store.js removeKeputusan).
      // Any other unrecognized status is intentionally excluded from the count.
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
      ? `${item.armada}${item.eta ? ` · Estimasi tiba ${formatDate(item.eta)}` : ""}`
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

  // Periode sebelumnya untuk perbandingan (minggu lalu / bulan lalu).
  const rangeSebelumnya = useMemo(() => {
    if (!range) return null;
    if (periode === "minggu-ini") {
      return { start: new Date(range.start.getTime() - 7 * HARI_MS), end: new Date(range.end.getTime() - 7 * HARI_MS) };
    }
    // bulan-ini
    const start = new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1);
    const end = new Date(range.start.getFullYear(), range.start.getMonth(), 0);
    return { start, end };
  }, [range, periode]);

  // Ringkasan eksekutif: angka kunci periode + perbandingan + kesimpulan.
  const eksekutif = useMemo(() => {
    const sumberIni = isTimLogistik ? filteredKeputusan : filteredRiwayat;
    const volumeIni = sumberIni.reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0);
    const jumlahIni = sumberIni.length;

    let volumeLalu = null;
    if (rangeSebelumnya) {
      const src = isTimLogistik ? snapshot.keputusan ?? [] : snapshot.riwayatKeputusan ?? [];
      volumeLalu = src
        .filter((item) => isDateInRange(item.tanggal_keputusan, rangeSebelumnya))
        .reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0);
    }
    const delta = volumeLalu !== null && volumeLalu > 0 ? Math.round(((volumeIni - volumeLalu) / volumeLalu) * 100) : null;

    let kesimpulan;
    if (delta !== null) {
      kesimpulan = `Periode ini total distribusi ${volumeIni} ton dari ${jumlahIni} keputusan, ${delta >= 0 ? "naik" : "turun"} ${Math.abs(delta)} persen dari periode sebelumnya (${volumeLalu} ton).`;
    } else {
      kesimpulan = `Total distribusi periode ini ${volumeIni} ton dari ${jumlahIni} keputusan.`;
    }
    return { volumeIni, jumlahIni, volumeLalu, delta, kesimpulan };
  }, [isTimLogistik, filteredKeputusan, filteredRiwayat, rangeSebelumnya, snapshot.keputusan, snapshot.riwayatKeputusan]);

  // Perbandingan periode (MIS): varians metrik kunci periode terpilih vs
  // periode sebelumnya. Delta relatif (%) untuk nilai absolut, selisih poin
  // untuk metrik yang sudah berupa persentase.
  const perbandinganPeriode = useMemo(() => {
    if (!range || !rangeSebelumnya) return null;

    const permintaanSemua = snapshot.permintaan ?? [];
    const sumberKeputusan = isTimLogistik ? snapshot.keputusan ?? [] : snapshot.riwayatKeputusan ?? [];

    const hitungMetrik = (r) => {
      const permintaanRange = permintaanSemua.filter(
        (item) => item.tanggal_permintaan && isDateInRange(item.tanggal_permintaan, r)
      );
      const keputusanRange = sumberKeputusan.filter(
        (item) => item.tanggal_keputusan && isDateInRange(item.tanggal_keputusan, r)
      );
      const selesai = keputusanRange.filter((item) => item.status === "selesai");
      const berEta = selesai.filter((item) => item.eta && item.waktu_selesai);
      const tepat = berEta.filter(
        (item) => new Date(item.waktu_selesai) <= new Date(`${item.eta}T23:59:59`)
      );
      return {
        totalPermintaan: Math.round(permintaanRange.reduce((total, item) => total + (Number(item.jumlah_permintaan) || 0), 0) * 10) / 10,
        volumeKeputusan: Math.round(keputusanRange.reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0) * 10) / 10,
        jumlahSelesai: selesai.length,
        ketepatan: berEta.length > 0 ? Math.round((tepat.length / berEta.length) * 100) : null,
      };
    };

    const ini = hitungMetrik(range);
    const lalu = hitungMetrik(rangeSebelumnya);

    const deltaRelatif = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

    return [
      { label: "Total Permintaan", ini: `${ini.totalPermintaan} ton`, lalu: `${lalu.totalPermintaan} ton`, delta: deltaRelatif(ini.totalPermintaan, lalu.totalPermintaan), satuan: "%" },
      { label: isTimLogistik ? "Volume Distribusi" : "Volume Keputusan", ini: `${ini.volumeKeputusan} ton`, lalu: `${lalu.volumeKeputusan} ton`, delta: deltaRelatif(ini.volumeKeputusan, lalu.volumeKeputusan), satuan: "%" },
      { label: "Pengiriman Selesai", ini: `${ini.jumlahSelesai}`, lalu: `${lalu.jumlahSelesai}`, delta: deltaRelatif(ini.jumlahSelesai, lalu.jumlahSelesai), satuan: "%" },
      {
        label: "Ketepatan Estimasi Tiba",
        ini: ini.ketepatan !== null ? `${ini.ketepatan}%` : "—",
        lalu: lalu.ketepatan !== null ? `${lalu.ketepatan}%` : "—",
        delta: ini.ketepatan !== null && lalu.ketepatan !== null ? ini.ketepatan - lalu.ketepatan : null,
        satuan: " poin",
      },
    ];
  }, [range, rangeSebelumnya, isTimLogistik, snapshot.permintaan, snapshot.keputusan, snapshot.riwayatKeputusan]);

  // Tab Efisiensi (Manajer): tingkat pemenuhan, rata-rata waktu, % pembatalan.
  const efisiensi = useMemo(() => {
    const total = filteredRiwayat.length;
    const selesai = filteredRiwayat.filter((item) => item.status === "selesai");
    const dibatalkan = filteredRiwayat.filter((item) => item.status === "dibatalkan").length;
    const durasi = selesai
      .map((item) => (item.waktu_menunggu && item.waktu_selesai ? (new Date(item.waktu_selesai) - new Date(item.waktu_menunggu)) / HARI_MS : null))
      .filter((nilai) => nilai !== null && nilai >= 0);
    return {
      tingkatPemenuhan: total > 0 ? Math.round((selesai.length / total) * 100) : 0,
      persenPembatalan: total > 0 ? Math.round((dibatalkan / total) * 100) : 0,
      rataWaktu: durasi.length > 0 ? Math.round((durasi.reduce((a, b) => a + b, 0) / durasi.length) * 10) / 10 : null,
    };
  }, [filteredRiwayat]);

  // Tab Anomali (Manajer): permintaan melebihi kapasitas + ETA terlewat.
  const anomaliList = useMemo(() => {
    const list = [];
    const kapMap = new Map(daftarKota.map((kota) => [kota.nama, Number(kota.kapasitas) || 0]));
    filteredPermintaan.forEach((item) => {
      const kap = kapMap.get(item.kota) ?? 0;
      if (kap > 0 && (Number(item.jumlah_permintaan) || 0) > kap) {
        list.push({ tanggal: item.tanggal_permintaan, kota: item.kota, jenis: "Permintaan melebihi kapasitas", detail: `${item.jumlah_permintaan} ton > kapasitas ${kap} ton` });
      }
    });
    const hariIni = parseDate(getLocalDateKey());
    filteredKeputusan.forEach((item) => {
      if (item.status === "dalam-pengiriman" && item.eta && parseDate(item.eta) < hariIni) {
        list.push({ tanggal: item.tanggal_keputusan, kota: item.kota_tujuan, jenis: "Estimasi tiba terlewat", detail: `Estimasi tiba ${formatDate(item.eta)}` });
      }
    });
    return list
      .filter((item) => !anomaliKota || item.kota === anomaliKota)
      .sort((a, b) => parseDate(b.tanggal) - parseDate(a.tanggal));
  }, [filteredPermintaan, filteredKeputusan, daftarKota, anomaliKota]);

  // Tab Kota (Manajer): perbandingan kinerja per kota.
  const kotaPerforma = useMemo(() => {
    const map = new Map();
    filteredPermintaan.forEach((item) => {
      const entry = map.get(item.kota) ?? { permintaan: 0, alokasi: 0, selesai: 0 };
      entry.permintaan += Number(item.jumlah_permintaan) || 0;
      map.set(item.kota, entry);
    });
    filteredKeputusan.forEach((item) => {
      const entry = map.get(item.kota_tujuan) ?? { permintaan: 0, alokasi: 0, selesai: 0 };
      entry.alokasi += Number(item.volume_tbs) || 0;
      if (item.status === "selesai") entry.selesai += 1;
      map.set(item.kota_tujuan, entry);
    });
    return [...map.entries()]
      .map(([kota, entry]) => ({ kota, ...entry, pemenuhan: entry.permintaan > 0 ? Math.round((entry.alokasi / entry.permintaan) * 100) : 0 }))
      .sort((a, b) => b.permintaan - a.permintaan);
  }, [filteredPermintaan, filteredKeputusan]);

  const noData = isTimLogistik
    ? filteredKeputusan.length === 0 &&
      statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai === 0
    : filteredRiwayat.length === 0 && chartConfig.labels.length === 0;

  // Membangun dokumen laporan formal (siap cetak / simpan sebagai PDF lewat
  // dialog cetak browser) bergaya surat resmi perusahaan: kop, judul, ringkasan
  // eksekutif, tabel rincian, blok tanda tangan, dan kaki dokumen. Tanpa
  // library tambahan.
  const buildLaporanHtml = () => {
    const esc = (v) =>
      String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const now = new Date();
    const tglPanjang = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(now);
    const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(now);
    // Nomor surat otomatis: NNN/LAP-DIST/SWITERA/<bulan romawi>/<tahun>, dengan
    // NNN dari nomor hari dalam tahun agar terlihat berurutan dan unik per hari.
    const bulanRomawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][now.getMonth()];
    const awalTahun = new Date(now.getFullYear(), 0, 0);
    const nomorUrut = String(Math.ceil((now - awalTahun) / (24 * 60 * 60 * 1000))).padStart(3, "0");
    const nomorSurat = `${nomorUrut}/LAP-DIST/SWITERA/${bulanRomawi}/${now.getFullYear()}`;
    const periodeLabel = (periodeOptions.find(([key]) => key === periode) || [null, "Semua"])[1];
    const judul = isTimLogistik ? "LAPORAN STATUS DISTRIBUSI" : "LAPORAN DISTRIBUSI TBS";
    const nama = snapshot.userAktif?.nama ?? "Pengguna";
    const perbandingan =
      eksekutif.delta !== null
        ? `${eksekutif.delta >= 0 ? "naik " : "turun "}${Math.abs(eksekutif.delta)}% dibanding periode sebelumnya (${eksekutif.volumeLalu} ton)`
        : "Tidak tersedia untuk periode ini";

    const sumberUtama = isTimLogistik ? filteredKeputusan : filteredRiwayat;
    const barisUtama = sumberUtama
      .map((item, i) =>
        isTimLogistik
          ? `<tr><td class="num">${i + 1}</td><td>${esc(formatDate(item.tanggal_keputusan))}</td><td>${esc(item.kota_tujuan)}</td><td class="num">${esc(item.volume_tbs)}</td><td>${esc(item.armada ? item.armada + (item.eta ? ` / Estimasi tiba ${formatDate(item.eta)}` : "") : "-")}</td><td>${esc(statusLabels[item.status] ?? item.status)}</td></tr>`
          : `<tr><td class="num">${i + 1}</td><td>${esc(formatDate(item.tanggal_keputusan))}</td><td>${esc(item.kota_tujuan)}</td><td class="num">${esc(item.volume_tbs)}</td><td>${esc(item.diputuskan_oleh)}</td><td>${esc(statusLabels[item.status] ?? item.status)}</td></tr>`
      )
      .join("");

    const kolomUtama = isTimLogistik
      ? '<th class="num">No</th><th>Tanggal</th><th>Kota Tujuan</th><th class="num">Volume (ton)</th><th>Armada / Estimasi Tiba</th><th>Status</th>'
      : '<th class="num">No</th><th>Tanggal</th><th>Kota Tujuan</th><th class="num">Volume (ton)</th><th>Diputuskan Oleh</th><th>Status</th>';

    // Bagian khusus Manajer: efisiensi + kinerja per kota.
    let bagianManajer = "";
    if (!isTimLogistik) {
      const barisKota = kotaPerforma
        .map(
          (k, i) =>
            `<tr><td class="num">${i + 1}</td><td>${esc(k.kota)}</td><td class="num">${k.permintaan}</td><td class="num">${k.alokasi}</td><td class="num">${k.pemenuhan}%</td><td class="num">${k.selesai}</td></tr>`
        )
        .join("");
      bagianManajer = `
        <div class="section-title">II. Indikator Efisiensi</div>
        <table>
          <tbody>
            <tr><th>Tingkat Pemenuhan</th><td class="num">${efisiensi.tingkatPemenuhan}%</td></tr>
            <tr><th>Rata-rata Waktu Penyelesaian</th><td class="num">${efisiensi.rataWaktu !== null ? `${efisiensi.rataWaktu} hari` : "Belum ada data"}</td></tr>
            <tr><th>Persentase Pembatalan</th><td class="num">${efisiensi.persenPembatalan}%</td></tr>
          </tbody>
        </table>
        <div class="section-title">III. Rincian Riwayat Keputusan</div>
        <table><thead><tr>${kolomUtama}</tr></thead><tbody>${barisUtama || '<tr><td colspan="6" style="text-align:center">Tidak ada data.</td></tr>'}</tbody></table>
        <div class="section-title">IV. Kinerja per Kota</div>
        <table><thead><tr><th class="num">No</th><th>Kota</th><th class="num">Permintaan (ton)</th><th class="num">Dialokasikan (ton)</th><th class="num">Pemenuhan</th><th class="num">Selesai</th></tr></thead><tbody>${barisKota || '<tr><td colspan="6" style="text-align:center">Tidak ada data.</td></tr>'}</tbody></table>`;
    } else {
      bagianManajer = `
        <div class="section-title">II. Rincian Distribusi</div>
        <table><thead><tr>${kolomUtama}</tr></thead><tbody>${barisUtama || '<tr><td colspan="6" style="text-align:center">Tidak ada data.</td></tr>'}</tbody></table>`;
    }

    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul} - Switera</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #111; font-size: 12pt; line-height: 1.5; margin: 0; }
  .kop { display: flex; align-items: center; gap: 14px; border-bottom: 3px double #000; padding-bottom: 10px; }
  .kop .logo { width: 54px; height: 54px; flex-shrink: 0; border: 2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; font-weight: 800; font-size: 24px; background: #BCF819; }
  .kop h1 { margin: 0; font-family: Arial, sans-serif; font-size: 22pt; letter-spacing: 1px; }
  .kop p { margin: 2px 0 0; font-size: 10pt; color: #333; }
  h2.judul { text-align: center; text-transform: uppercase; font-size: 15pt; margin: 22px 0 2px; text-decoration: underline; letter-spacing: 0.5px; }
  .subjudul { text-align: center; font-size: 11pt; margin: 0 0 18px; }
  table.meta { border: none; margin: 0 0 14px; font-size: 11pt; }
  table.meta td { border: none; padding: 1px 0; }
  table.meta td:first-child { width: 150px; }
  .section-title { font-weight: bold; font-size: 12pt; margin: 18px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 10.5pt; }
  th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; vertical-align: top; }
  thead th { background: #eeeeee; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .ringkasan { border: 1px solid #444; background: #fafafa; padding: 10px 14px; margin: 6px 0 12px; text-align: justify; }
  .ttd { margin-top: 42px; width: 280px; float: right; text-align: center; font-size: 11pt; }
  .ttd .nama { font-weight: bold; text-decoration: underline; margin-top: 64px; }
  .footer { clear: both; margin-top: 70px; border-top: 1px solid #999; padding-top: 6px; font-size: 9pt; color: #666; text-align: center; }
</style></head>
<body>
  <div class="kop">
    <div class="logo">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20C4 11 10 4.5 20 4C19.5 13.5 12.5 20 4 20Z" fill="#254000" stroke="#000000" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M6.5 17.5C10 14 13.5 10.5 17.5 7.5" stroke="#000000" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M12 16C12 13 13 10.5 15 8.5M9 18C9.5 16 10.2 14.5 11.2 13" stroke="#000000" stroke-width="1.1" stroke-linecap="round"/>
      </svg>
    </div>
    <div>
      <h1>SWITERA</h1>
      <p>Sistem Informasi Manajemen Distribusi TBS (Tandan Buah Segar)</p>
    </div>
  </div>

  <h2 class="judul">${judul}</h2>
  <p class="subjudul">Periode: ${esc(periodeLabel)}</p>

  <table class="meta"><tbody>
    <tr><td>Nomor</td><td>: ${esc(nomorSurat)}</td></tr>
    <tr><td>Tanggal Cetak</td><td>: ${esc(tglPanjang)} pukul ${esc(jam)} WIB</td></tr>
    <tr><td>Dicetak oleh</td><td>: ${esc(nama)} (${esc(roleAktif)})</td></tr>
    <tr><td>Total Volume</td><td>: ${esc(eksekutif.volumeIni)} ton</td></tr>
    <tr><td>Jumlah ${isTimLogistik ? "Pengiriman" : "Keputusan"}</td><td>: ${esc(eksekutif.jumlahIni)}</td></tr>
  </tbody></table>

  <div class="section-title">I. Ringkasan Eksekutif</div>
  <div class="ringkasan">
    ${esc(eksekutif.kesimpulan)} Total volume distribusi pada periode ini sebesar <strong>${esc(eksekutif.volumeIni)} ton</strong> (${esc(perbandingan)}).
  </div>

  ${bagianManajer}

  <div class="ttd">
    <div>&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;, ${esc(tglPanjang)}</div>
    <div>${esc(roleAktif)}</div>
    <div class="nama">( ${esc(nama)} )</div>
  </div>

  <div class="footer">
    Dokumen ini dihasilkan otomatis oleh Sistem Informasi Manajemen Switera pada ${esc(tglPanjang)} pukul ${esc(jam)} WIB.
  </div>

  <script>window.onload = function () { setTimeout(function () { window.print(); }, 200); };</script>
</body></html>`;
  };

  const cetakLaporan = () => {
    const win = window.open("", "_blank", "width=920,height=760");
    if (!win) {
      showToast({ type: "warning", message: "Popup diblokir browser. Izinkan popup untuk mencetak laporan." });
      return;
    }
    win.document.open();
    win.document.write(buildLaporanHtml());
    win.document.close();
  };

  // Tab switching ala Stitch — underline geser antara tabel & grafik.
  const [activeTab, setActiveTab] = useState(0);
  const tabLabels = isTimLogistik
    ? ["Distribusi Aktif", "Status Pengiriman"]
    : ["Riwayat Keputusan", "Tren Permintaan", "Efisiensi", "Anomali", "Kota"];
  const tabWidth = tabLabels.length > 3 ? 128 : 180;

  const TabBar = (
    <div style={{ position: "relative", display: "inline-flex", borderBottom: "2px solid #000000", maxWidth: "100%", overflowX: "auto" }}>
      {tabLabels.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => setActiveTab(index)}
          style={{
            width: `${tabWidth}px`,
            flexShrink: 0,
            padding: "12px 8px",
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-bold)",
            color: activeTab === index ? "#000000" : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "color var(--transition-fast)",
          }}
        >
          {label}
        </button>
      ))}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-2px",
          left: 0,
          width: `${tabWidth}px`,
          height: "4px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--color-lime-bold)",
          border: "1px solid #000000",
          boxSizing: "border-box",
          transform: `translateX(${activeTab * tabWidth}px)`,
          transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );

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
              label="Cetak Laporan"
              onClick={cetakLaporan}
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
        {/* Summary stats bento ala laporan_distribusi_switera. */}
        {!noData ? (
          <div
            className="stagger-children app-grid-4"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(160px, 1fr))", gap: "var(--space-4)" }}
          >
            {isTimLogistik ? (
              <>
                <MetricCard label="Total Volume TBS" nilai={`${filteredKeputusan.reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0)} ton`} size="lg" accent="primary" />
                <MetricCard label="Total Pengiriman" nilai={String(filteredKeputusan.length)} size="lg" accent="info" />
                <MetricCard label="Dalam Pengiriman" nilai={String(statusCounts["dalam-pengiriman"])} size="lg" accent="warning" />
                <MetricCard label="Selesai" nilai={String(statusCounts.selesai)} size="lg" accent="success" />
              </>
            ) : (
              <>
                <MetricCard label="Total Volume TBS" nilai={`${filteredRiwayat.reduce((total, item) => total + (Number(item.volume_tbs) || 0), 0)} ton`} size="lg" accent="primary" />
                <MetricCard label="Total Keputusan" nilai={String(filteredRiwayat.length)} size="lg" accent="info" />
                <MetricCard label="Selesai" nilai={String(filteredRiwayat.filter((item) => item.status === "selesai").length)} size="lg" accent="success" />
                <MetricCard label="Dibatalkan" nilai={String(filteredRiwayat.filter((item) => item.status === "dibatalkan").length)} size="lg" accent="danger" />
              </>
            )}
          </div>
        ) : null}

        {/* Ringkasan eksekutif (MIS): angka kunci + perbandingan + kesimpulan. */}
        {!noData ? (
          <Card style={{ borderRadius: "var(--radius-2xl)", padding: "var(--space-5) var(--space-6)" }}>
            <SectionHeader>Ringkasan Eksekutif</SectionHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
              <div>
                <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>Total Distribusi</p>
                <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-3xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>{formatTonase(eksekutif.volumeIni)}</p>
              </div>
              {eksekutif.delta !== null ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-bold)",
                    border: "2px solid #000000",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 12px",
                    backgroundColor: "var(--color-pastel)",
                    color: eksekutif.delta >= 0 ? "var(--color-primary)" : "var(--color-danger-text)",
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: "16px" }}>
                    {eksekutif.delta >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  {eksekutif.delta >= 0 ? "+" : ""}{eksekutif.delta}% vs periode lalu
                </span>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Perbandingan tersedia untuk periode Minggu/Bulan ini.</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              {eksekutif.kesimpulan}
            </p>
          </Card>
        ) : null}

        {/* Perbandingan periode (MIS): varians metrik kunci vs periode lalu. */}
        {!noData && perbandinganPeriode ? (
          <Card>
            <SectionHeader>Perbandingan Periode</SectionHeader>
            <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              {periode === "minggu-ini" ? "Minggu ini dibandingkan minggu lalu" : "Bulan ini dibandingkan bulan lalu"} — perubahan
              tiap metrik kunci sebagai dasar evaluasi kinerja periode berjalan.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {perbandinganPeriode.map((baris) => (
                <div
                  key={baris.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(140px, 1.4fr) 1fr 1fr minmax(110px, 1fr)",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    border: "2px solid #000000",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-2) var(--space-4)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>
                    {baris.label}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{baris.ini}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>dari {baris.lalu}</span>
                  {baris.delta !== null ? (
                    <span
                      style={{
                        justifySelf: "end",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "2px solid #000000",
                        borderRadius: "var(--radius-full)",
                        padding: "2px 10px",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-weight-bold)",
                        backgroundColor: baris.delta >= 0 ? "var(--color-lime)" : "var(--color-danger-bg)",
                        color: baris.delta >= 0 ? "#000000" : "var(--color-danger-text)",
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: "14px", lineHeight: 1 }}>
                        {baris.delta >= 0 ? "trending_up" : "trending_down"}
                      </span>
                      {baris.delta >= 0 ? "+" : ""}{baris.delta}{baris.satuan}
                    </span>
                  ) : (
                    <span style={{ justifySelf: "end", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Tak terbanding</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* AI-1: ringkasan naratif otomatis — tampil untuk kedua role selama
            ada data pada periode terpilih. */}
        {!noData ? <RingkasanAI periode={periode} /> : null}

        {noData ? (
          <EmptyState pesan="Tidak ada data pada periode yang dipilih." />
        ) : isTimLogistik ? (
          <>
            {TabBar}
            {activeTab === 0 ? (
            filteredKeputusan.length > 0 ? (
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
                    { key: "armada", label: "Armada / Estimasi Tiba" },
                    { key: "status", label: "Status" },
                  ]}
                  data={tableRowsTimLogistik}
                />
              </Card>
            ) : (
              <EmptyState pesan="Belum ada distribusi aktif pada periode yang dipilih." />
            )
            ) : statusCounts.menunggu + statusCounts["dalam-pengiriman"] + statusCounts.selesai > 0 ? (
              <GrafikStatusPengiriman counts={statusCounts} />
            ) : (
              <EmptyState pesan="Belum ada data status distribusi pada periode yang dipilih." />
            )}
          </>
        ) : (
          <>
            {TabBar}
            {activeTab === 0 ? (
              filteredRiwayat.length > 0 ? (
                <Card>
                  <SectionHeader>Riwayat Keputusan</SectionHeader>
                  <p style={{ margin: "0 0 1rem", color: "var(--color-text-secondary)", lineHeight: 1.6, fontSize: "var(--text-sm)" }}>
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
              )
            ) : activeTab === 1 ? (
              chartConfig.labels.length > 0 && chartConfig.datasets.length > 0 ? (
                <GrafikTrenPermintaan labels={chartConfig.labels} datasets={chartConfig.datasets} />
              ) : (
                <EmptyState pesan="Belum ada data tren permintaan pada periode yang dipilih." />
              )
            ) : activeTab === 2 ? (
              <>
                <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                  <MetricCard label="Tingkat Pemenuhan" nilai={`${efisiensi.tingkatPemenuhan}%`} size="lg" accent="primary" />
                  <MetricCard label="Rata-rata Waktu" nilai={efisiensi.rataWaktu !== null ? `${efisiensi.rataWaktu} hari` : "Belum ada"} size="lg" accent="info" />
                  <MetricCard label="Persentase Pembatalan" nilai={`${efisiensi.persenPembatalan}%`} size="lg" accent="danger" />
                </div>
                {chartConfig.labels.length > 0 && chartConfig.datasets.length > 0 ? (
                  <GrafikTrenPermintaan labels={chartConfig.labels} datasets={chartConfig.datasets} />
                ) : null}
              </>
            ) : activeTab === 3 ? (
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                  <SectionHeader>Kejadian Anomali</SectionHeader>
                  <select
                    value={anomaliKota}
                    onChange={(event) => setAnomaliKota(event.target.value)}
                    className="field-select"
                    style={{ border: "2px solid #000000", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: "8px 32px 8px 14px", boxShadow: "var(--shadow-sm)" }}
                  >
                    <option value="">Semua kota</option>
                    {daftarKota.map((kota) => (
                      <option key={kota.nama} value={kota.nama}>{kota.nama}</option>
                    ))}
                  </select>
                </div>
                {anomaliList.length > 0 ? (
                  <Tabel
                    kolom={[
                      { key: "tanggal", label: "Tanggal" },
                      { key: "kota", label: "Kota" },
                      { key: "jenis", label: "Jenis Anomali" },
                      { key: "detail", label: "Detail" },
                    ]}
                    data={anomaliList.map((item, index) => ({ id: `${item.kota}-${index}`, tanggal: formatDate(item.tanggal), kota: item.kota, jenis: item.jenis, detail: item.detail }))}
                  />
                ) : (
                  <EmptyState pesan="Tidak ada anomali pada periode dan filter yang dipilih." />
                )}
              </Card>
            ) : (
              <Card>
                <SectionHeader>Perbandingan Kinerja per Kota</SectionHeader>
                {kotaPerforma.length > 0 ? (
                  <Tabel
                    kolom={[
                      { key: "kota", label: "Kota" },
                      { key: "permintaan", label: "Permintaan", numeric: true },
                      { key: "alokasi", label: "Dialokasikan", numeric: true },
                      { key: "pemenuhan", label: "Pemenuhan", numeric: true },
                      { key: "selesai", label: "Selesai", numeric: true },
                    ]}
                    data={kotaPerforma.map((item) => ({ id: item.kota, kota: item.kota, permintaan: formatTonase(item.permintaan), alokasi: formatTonase(item.alokasi), pemenuhan: `${item.pemenuhan}%`, selesai: item.selesai }))}
                  />
                ) : (
                  <EmptyState pesan="Belum ada data kota pada periode yang dipilih." />
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Laporan;
