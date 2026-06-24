import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import useRipple from "../hooks/useRipple";
import Login from "./Login";
import Register from "./Register";
import PetaGeografis from "../components/PetaGeografis";
import IkonDaun from "../components/IkonDaun";
import store from "../store";
import { aggregatePermintaanRanking } from "../utils/distribusi";

const FITUR_LIST = [
  {
    type: "ranking",
    judul: "Ranking Kota Otomatis",
    deskripsi:
      "Sistem menghitung dan mengurutkan kota berdasarkan total permintaan secara otomatis.",
    poin: [
      "Ranking dihitung otomatis dari data permintaan",
      "Urutan kota diperbarui setiap ada data baru",
      "Tidak perlu hitung manual satu per satu",
    ],
  },
  {
    type: "rekomendasi",
    judul: "Rekomendasi Distribusi",
    deskripsi:
      "Saran kota tujuan distribusi berdasarkan data, bukan tebakan manual.",
    poin: [
      "Saran kota tujuan berbasis data, bukan tebakan",
      "Mempercepat pengambilan keputusan distribusi",
      "Mengurangi risiko salah kirim",
    ],
  },
  {
    type: "dashboard",
    judul: "Dashboard Terpusat",
    deskripsi:
      "Semua data permintaan dan distribusi terkumpul dalam satu tempat.",
    poin: [
      "Semua data permintaan dalam satu tampilan",
      "Status distribusi terlihat tanpa pindah halaman",
      "Memudahkan pemantauan harian",
    ],
  },
  {
    type: "multirole",
    judul: "Manajemen Multi-Role",
    deskripsi:
      "Akses berbeda untuk Admin, Manajer Distribusi, dan Tim Logistik.",
    poin: [
      "Akses Admin, Manajer, dan Tim Logistik terpisah",
      "Setiap role hanya melihat yang relevan",
      "Mengurangi risiko kesalahan akses data",
    ],
  },
  {
    type: "laporan",
    judul: "Laporan & Riwayat",
    deskripsi: "Pantau histori keputusan distribusi kapan saja diperlukan.",
    poin: [
      "Riwayat keputusan tersimpan otomatis",
      "Bisa diakses kapan saja diperlukan",
      "Memudahkan evaluasi distribusi sebelumnya",
    ],
  },
  {
    type: "realtime",
    judul: "Update Real-Time",
    deskripsi:
      "Perubahan status distribusi langsung terlihat oleh seluruh tim.",
    poin: [
      "Status distribusi terupdate langsung",
      "Seluruh tim melihat perubahan yang sama",
      "Tidak ada informasi yang tertinggal",
    ],
  },
];

const TESTIMONIAL_CHIPS = [
  { initial: "BS", avatarBg: "#2563eb", label: "Budi S. — Admin" },
  { initial: "RW", avatarBg: "var(--color-primary)", label: "Rina W. — Logistik" },
  { initial: "HW", avatarBg: "#d97706", label: "Hendra W. — Manajer" },
];

const LANGKAH_LIST = [
  {
    nomor: 1,
    judul: "Input Data Permintaan",
    deskripsi: "Admin menginput data permintaan TBS per kota.",
  },
  {
    nomor: 2,
    judul: "Analisis & Ranking",
    deskripsi:
      "Sistem menganalisis data dan membuat ranking kota secara otomatis.",
  },
  {
    nomor: 3,
    judul: "Keputusan & Distribusi",
    deskripsi:
      "Manajer mengambil keputusan, Tim Logistik menjalankan distribusi.",
  },
];

const STATISTIK_LIST = [
  { nilai: "8", label: "Kota Terpantau", icon: "kota" },
  { nilai: "20+", label: "Data Permintaan", icon: "data" },
  { nilai: "<1 Detik", label: "Analisis Ranking", icon: "kecepatan" },
  { nilai: "3 Role", label: "Akses Terstruktur", icon: "role" },
];

const FAQ_LIST = [
  {
    pertanyaan: "Apakah Switera bisa digunakan oleh banyak role sekaligus?",
    jawaban:
      "Ya. Switera mendukung tiga role: Admin, Manajer Distribusi, dan Tim Logistik. Setiap role memiliki akses dan tampilan menu yang berbeda sesuai tanggung jawabnya.",
  },
  {
    pertanyaan: "Bagaimana sistem menentukan rekomendasi kota tujuan?",
    jawaban:
      "Sistem menghitung skor gabungan dari total permintaan dan kapasitas kota, lalu menyarankan kota dengan skor tertinggi sebagai tujuan distribusi yang paling efisien.",
  },
  {
    pertanyaan: "Apakah data yang sudah diinput bisa diubah kembali?",
    jawaban:
      "Bisa. Admin dapat mengedit atau menghapus data permintaan kapan saja melalui halaman Manajemen Data, dan perubahannya langsung tercermin di seluruh halaman terkait.",
  },
  {
    pertanyaan: "Apakah riwayat keputusan distribusi tersimpan secara permanen?",
    jawaban:
      "Ya. Seluruh keputusan distribusi, termasuk yang dibatalkan, tetap tercatat pada halaman Laporan untuk keperluan audit dan evaluasi di kemudian hari.",
  },
];

function IkonArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IkonCentang({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FiturIcon({ type, size = 20 }) {
  const stroke = "var(--color-primary)";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  };

  switch (type) {
    case "ranking":
      return (
        <svg {...common}>
          <path d="M5 19H19" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M8 16V11" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 16V7" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 16V13" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "rekomendasi":
      return (
        <svg {...common}>
          <path
            d="M12 3L14.5 8.5L20.5 9.3L16 13.3L17.2 19.3L12 16.3L6.8 19.3L8 13.3L3.5 9.3L9.5 8.5L12 3Z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 4H10V10H4V4Z" stroke={stroke} strokeWidth="2" />
          <path d="M14 4H20V10H14V4Z" stroke={stroke} strokeWidth="2" />
          <path d="M4 14H10V20H4V14Z" stroke={stroke} strokeWidth="2" />
          <path d="M14 14H20V20H14V14Z" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "multirole":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth="2" />
          <path
            d="M3.5 19C4.8 15.8 6.8 14 9 14C11.2 14 13.2 15.8 14.5 19"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="17" cy="7" r="2.3" stroke={stroke} strokeWidth="1.8" />
          <path
            d="M14.8 13.2C15.8 12.6 16.9 12.4 17.5 12.4C19 12.4 20.3 13.7 21 16"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "laporan":
      return (
        <svg {...common}>
          <path
            d="M7 4H14L18 8V20H7V4Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M14 4V8H18" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 12H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M9 16H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "realtime":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" />
          <path
            d="M12 7V12L15.5 14"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function RippleSpans({ ripples, removeRipple }) {
  return ripples.map((ripple) => (
    <span
      key={ripple.id}
      className="ripple-span"
      style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
      onAnimationEnd={() => removeRipple(ripple.id)}
    />
  ));
}

function StatIcon({ type }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true };
  const stroke = "var(--color-primary)";

  switch (type) {
    case "kota":
      return (
        <svg {...common}>
          <path
            d="M12 21C12 21 19 14.5 19 9.5C19 5.35786 15.6421 2 12 2C8.35786 2 5 5.35786 5 9.5C5 14.5 12 21 12 21Z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9.5" r="2.5" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case "data":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="7" ry="3" stroke={stroke} strokeWidth="1.8" />
          <path d="M5 6V18C5 19.6569 8.13401 21 12 21C15.866 21 19 19.6569 19 18V6" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case "kecepatan":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.8" />
          <path d="M12 7V12L15.5 14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "role":
    default:
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth="1.8" />
          <path
            d="M3.5 19C4.8 15.8 6.8 14 9 14C11.2 14 13.2 15.8 14.5 19"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="17" cy="7" r="2.3" stroke={stroke} strokeWidth="1.6" />
        </svg>
      );
  }
}

function FaqItem({ pertanyaan, jawaban, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "transparent",
          border: "none",
          padding: "20px 4px",
          textAlign: "left",
          cursor: "pointer",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontSize: "16px",
          fontWeight: "var(--font-weight-semibold)",
        }}
      >
        {pertanyaan}
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            display: "inline-flex",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform var(--transition-base)",
            color: "var(--color-primary)",
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: isOpen ? "200px" : "0px",
          overflow: "hidden",
          transition: "max-height var(--transition-base)",
        }}
      >
        <p
          style={{
            margin: "0 4px 20px",
            color: "rgba(255,255,255,0.45)",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          {jawaban}
        </p>
      </div>
    </div>
  );
}

const SIZE_STYLES = {
  sm: { padding: "7px 16px", fontSize: "var(--text-xs)" },
  md: { padding: "11px 24px", fontSize: "var(--text-sm)" },
};

function LandingButton({ label, onClick, tone = "primer", size = "md", iconRight, style }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();

  return (
    <button
      type="button"
      className={`landing-btn landing-btn-${tone}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ ...SIZE_STYLES[size], ...style }}
    >
      {label}
      {iconRight}
      <RippleSpans ripples={ripples} removeRipple={removeRipple} />
    </button>
  );
}

function Reveal({ children, delay = 0, style, className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HeroGlow({ flip = false }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(ellipse 70% 40% at 50% ${flip ? "100%" : "0%"}, rgba(45,106,79,0.1) 0%, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  );
}

function MockupDashboard() {
  const metrics = [
    { label: "Total Kota", value: "8", accent: "var(--color-primary)" },
    { label: "Permintaan", value: "245 ton", accent: "var(--color-accent)" },
    { label: "Status Aktif", value: "12", accent: "var(--color-info)" },
  ];
  const tableRowAccents = ["var(--color-accent)", "var(--color-primary)", null, null];
  const sidebarItems = [
    { active: true, width: "80%" },
    { active: false, width: "65%" },
    { active: false, width: "70%" },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-mid)",
        borderBottom: "none",
        borderRadius: "14px 14px 0 0",
        boxShadow: "0 -4px 60px rgba(45,106,79,0.08), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
        width: "100%",
        maxWidth: "880px",
        margin: "0 auto",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface-2)",
          borderBottom: "1px solid var(--color-border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#27c93f" }} />
        <span style={{ marginLeft: "12px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
          Switera — Dashboard
        </span>
      </div>

      <div style={{ display: "flex", height: "280px", overflow: "hidden" }}>
        <div
          style={{
            width: "160px",
            flexShrink: 0,
            backgroundColor: "var(--color-surface-2)",
            borderRight: "1px solid var(--color-border)",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              style={{
                height: "24px",
                borderRadius: "5px",
                width: item.width,
                backgroundColor: item.active ? "rgba(45,106,79,0.2)" : "var(--color-surface-3)",
                borderLeft: item.active ? "2px solid var(--color-primary)" : "none",
              }}
            />
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px", backgroundColor: "var(--color-bg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {metrics.map((metric) => (
              <div
                key={metric.label}
                style={{
                  height: "64px",
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border-mid)",
                  borderTop: `2px solid ${metric.accent}`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: "6px", backgroundColor: "var(--color-surface-3)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ height: "7px", width: "60%", backgroundColor: "var(--color-surface-3)", borderRadius: "3px" }} />
                  <div style={{ height: "12px", width: "40%", marginTop: "6px", backgroundColor: "var(--color-surface-3)", borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: "28px", backgroundColor: "var(--color-surface-2)", borderRadius: "6px", marginBottom: "6px" }} />
          {tableRowAccents.map((accent, index) => (
            <div
              key={index}
              style={{
                height: "32px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderLeft: accent ? `2px solid ${accent}` : "1px solid var(--color-border)",
                borderRadius: "6px",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 12px",
              }}
            >
              {["20%", "40%", "15%"].map((width, blockIndex) => (
                <div key={blockIndex} style={{ width, height: "7px", backgroundColor: "var(--color-surface-3)", borderRadius: "3px" }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "relative",
          height: "0",
        }}
      />
    </div>
  );
}

function VisualCardShell({ children, icon }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-mid)",
        borderRadius: "14px",
        padding: "28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        aspectRatio: "4 / 3",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "8px",
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          flexShrink: 0,
        }}
      >
        <FiturIcon type={icon} size={18} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function FiturVisual({ type }) {
  if (type === "ranking") {
    const rows = [
      { rank: "🏆 #1", city: "Pekanbaru", pct: 90, ton: "287 ton", highlight: true },
      { rank: "#2", city: "Medan", pct: 70, ton: "220 ton" },
      { rank: "#3", city: "Palembang", pct: 55, ton: "178 ton" },
    ];
    return (
      <VisualCardShell icon="ranking">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map((row) => (
            <div
              key={row.city}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: row.highlight ? "var(--color-accent-subtle)" : "transparent",
              }}
            >
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", width: "32px", flexShrink: 0 }}>{row.rank}</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", width: "76px", flexShrink: 0 }}>{row.city}</span>
              <span style={{ flex: 1, height: "6px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-surface-3)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${row.pct}%`, backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-full)" }} />
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", width: "52px", textAlign: "right", flexShrink: 0 }}>{row.ton}</span>
            </div>
          ))}
        </div>
      </VisualCardShell>
    );
  }

  if (type === "rekomendasi") {
    const stats = [
      { label: "PERMINTAAN", value: "287 ton" },
      { label: "KAPASITAS", value: "94%" },
    ];
    return (
      <VisualCardShell icon="rekomendasi">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px", height: "100%" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-primary)",
              backgroundColor: "rgba(45,106,79,0.15)",
              border: "1px solid rgba(45,106,79,0.25)",
              borderRadius: "var(--radius-full)",
              padding: "4px 10px",
              width: "fit-content",
            }}
          >
            🤖 Rekomendasi Sistem
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-weight-bold)", fontSize: "2rem", letterSpacing: "-0.03em", color: "#fff" }}>
            Pekanbaru
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%" }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "var(--font-weight-bold)", fontFamily: "var(--font-mono)", color: "#fff" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "var(--font-weight-semibold)",
              textAlign: "center",
              marginTop: "auto",
            }}
          >
            Tetapkan Tujuan →
          </div>
        </div>
      </VisualCardShell>
    );
  }

  if (type === "dashboard") {
    return (
      <VisualCardShell icon="dashboard">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <span style={{ display: "block", width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "var(--color-surface-3)", marginBottom: "10px" }} />
              <span style={{ display: "block", height: "7px", width: "70%", backgroundColor: "var(--color-surface-3)", borderRadius: "3px" }} />
              <span style={{ display: "block", height: "14px", width: "45%", marginTop: "8px", backgroundColor: "var(--color-border-mid)", borderRadius: "3px" }} />
            </div>
          ))}
        </div>
      </VisualCardShell>
    );
  }

  if (type === "multirole") {
    const roles = [
      { label: "Admin", color: "var(--color-primary)" },
      { label: "Manajer Distribusi", color: "var(--color-accent)" },
      { label: "Tim Logistik", color: "var(--color-info)" },
    ];
    return (
      <VisualCardShell icon="multirole">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {roles.map((role) => (
            <div
              key={role.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: role.color, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{role.label}</span>
            </div>
          ))}
        </div>
      </VisualCardShell>
    );
  }

  if (type === "laporan") {
    return (
      <VisualCardShell icon="laporan">
        <svg viewBox="0 0 220 90" width="100%" height="120" fill="none" aria-hidden="true">
          <polyline
            points="0,65 30,48 60,55 90,25 120,38 150,12 180,28 220,18"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points="0,65 30,48 60,55 90,25 120,38 150,12 180,28 220,18 220,90 0,90"
            fill="var(--color-primary-subtle)"
            stroke="none"
          />
        </svg>
      </VisualCardShell>
    );
  }

  return (
    <VisualCardShell icon="realtime">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[0, 1, 2].map((index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--color-success)", flexShrink: 0 }} />
            <span style={{ flex: 1, height: "8px", width: `${70 - index * 12}%`, backgroundColor: "var(--color-surface-3)", borderRadius: "3px" }} />
            <span style={{ width: "28px", height: "8px", backgroundColor: "var(--color-border-mid)", borderRadius: "3px", flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </VisualCardShell>
  );
}

function Landing({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const rankingDemo = useMemo(() => aggregatePermintaanRanking(store.getPermintaan()), []);
  const daftarKotaDemo = useMemo(() => store.getDaftarKota(), []);

  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sectionLabelStyle = {
    margin: "0 0 var(--space-3)",
    fontSize: "var(--text-2xs)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-primary)",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
  };

  const sectionHeadingStyle = {
    margin: 0,
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: "var(--font-weight-bold)",
    letterSpacing: "-0.03em",
    textAlign: "center",
    color: "#fff",
  };

  const sectionSubtextStyle = {
    margin: "12px 0 0",
    color: "rgba(255,255,255,0.4)",
    lineHeight: "var(--leading-loose)",
    fontSize: "var(--text-md)",
    textAlign: "center",
  };

  return (
    <div
      className="landing-page"
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text-primary)",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <style>
        {`
          @keyframes landingFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes landingFadeInUp {
            from { opacity: 0; transform: translateY(var(--from-y, 20px)); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes landingPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }

          .landing-hero-mockup {
            position: relative;
          }

          .landing-hero-mockup::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 140px;
            background: linear-gradient(to bottom, transparent, var(--color-bg));
            pointer-events: none;
            z-index: 2;
          }

          .landing-feature-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            align-items: center;
            padding: 100px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .landing-feature-row:last-of-type {
            border-bottom: none;
          }

          .landing-feature-row.is-reverse .landing-feature-visual {
            order: -1;
          }

          .landing-nav-links {
            display: flex;
          }

          @media (max-width: 860px) {
            .landing-feature-row {
              grid-template-columns: 1fr;
              gap: 32px;
              padding: 64px 0;
            }

            .landing-feature-row.is-reverse .landing-feature-visual {
              order: 0;
            }
          }

          @media (max-width: 720px) {
            .landing-nav-links {
              display: none;
            }

            .landing-cara-kerja-connector {
              display: none;
            }
          }

          @media (max-width: 480px) {
            .landing-page section,
            .landing-page header {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
          }
        `}
      </style>

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-sticky)",
          height: "60px",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: scrolled ? "rgba(8,8,8,0.92)" : "rgba(8,8,8,0)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
          transition: "background-color 300ms ease, border-color 300ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
          <IkonDaun size={18} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: "var(--font-weight-semibold)",
              fontSize: "15px",
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Switera
          </span>
        </div>

        <nav className="landing-nav-links" style={{ alignItems: "center", gap: "32px", flexShrink: 0 }}>
          <a
            href="#fitur"
            onClick={(event) => {
              event.preventDefault();
              scrollToId("fitur");
            }}
            className="landing-nav-link"
          >
            Fitur
          </a>
          <a
            href="#cara-kerja"
            onClick={(event) => {
              event.preventDefault();
              scrollToId("cara-kerja");
            }}
            className="landing-nav-link"
          >
            Cara Kerja
          </a>
          <a
            href="#peta"
            onClick={(event) => {
              event.preventDefault();
              scrollToId("peta");
            }}
            className="landing-nav-link"
          >
            Peta
          </a>
          <a
            href="#faq"
            onClick={(event) => {
              event.preventDefault();
              scrollToId("faq");
            }}
            className="landing-nav-link"
          >
            FAQ
          </a>
        </nav>

        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0, flex: 1, justifyContent: "flex-end" }}>
          <LandingButton label="Masuk" tone="ghost" size="sm" onClick={openLogin} />
          <LandingButton label="Daftar" tone="primer" size="sm" onClick={openRegister} />
        </div>
      </header>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 48px 0",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <HeroGlow />

        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(45,106,79,0.1)",
              border: "1px solid rgba(45,106,79,0.2)",
              borderRadius: "100px",
              padding: "4px 12px 4px 6px",
              fontSize: "11px",
              color: "var(--color-primary)",
              marginBottom: "20px",
              animation: "landingFadeIn 600ms 100ms both",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-primary)", animation: "landingPulse 2s infinite" }} />
            Platform Distribusi TBS Kelapa Sawit
          </span>

          <h1
            style={{
              width: "100%",
              boxSizing: "border-box",
              margin: "0 auto 16px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.9rem, 8vw, 5rem)",
              fontWeight: "var(--font-weight-bold)",
              letterSpacing: "-0.04em",
              lineHeight: "1.08",
              color: "#fff",
              maxWidth: "800px",
              "--from-y": "20px",
              animation: "landingFadeInUp 700ms 200ms both",
            }}
          >
            Distribusi TBS yang Lebih Cepat dan{" "}
            <span
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, #fff 0%, rgba(45,106,79,0.85) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
                paddingRight: "0.18em",
                marginRight: "-0.18em",
              }}
            >
              Akurat
            </span>
          </h1>

          <p
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: "17px",
              color: "rgba(255,255,255,0.45)",
              maxWidth: "480px",
              margin: "0 auto 28px",
              lineHeight: "1.65",
              fontWeight: "var(--font-weight-normal)",
              "--from-y": "16px",
              animation: "landingFadeInUp 700ms 350ms both",
            }}
          >
            Sistem informasi berbasis data untuk membantu manajer distribusi
            menentukan kota tujuan TBS dengan tepat dan cepat.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "48px",
              animation: "landingFadeIn 600ms 500ms both",
            }}
          >
            <LandingButton
              label="Mulai Sekarang"
              tone="primer"
              size="md"
              style={{ padding: "10px 22px", fontSize: "14px", borderRadius: "8px" }}
              onClick={openRegister}
            />
            <LandingButton
              label="Lihat Demo"
              tone="ghost"
              size="md"
              style={{ padding: "10px 16px", fontSize: "14px", fontWeight: 400 }}
              iconRight={<IkonArrowRight size={13} />}
              onClick={() => scrollToId("fitur")}
            />
          </div>

          <div
            className="landing-hero-mockup"
            style={{
              maxWidth: "880px",
              width: "100%",
              marginTop: 0,
              marginBottom: 0,
              "--from-y": "32px",
              animation: "landingFadeInUp 800ms 600ms both",
            }}
          >
            <MockupDashboard />
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "48px",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          textAlign: "center",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <Reveal>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "64px", flexWrap: "wrap" }}>
            {STATISTIK_LIST.map((stat, index) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "64px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                    <StatIcon type={stat.icon} />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: "2.2rem",
                      letterSpacing: "-0.04em",
                      color: "#fff",
                    }}
                  >
                    {stat.nilai}
                  </div>
                  <div
                    style={{
                      marginTop: "4px",
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-normal)",
                      color: "rgba(255,255,255,0.3)",
                      fontSize: "12px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
                {index < STATISTIK_LIST.length - 1 ? (
                  <div aria-hidden="true" style={{ width: "1px", height: "40px", backgroundColor: "var(--color-border)" }} />
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="fitur" style={{ padding: "120px 48px 0", backgroundColor: "var(--color-bg)" }}>
        <Reveal>
          <div style={{ maxWidth: "640px", margin: "0 auto 0" }}>
            <p style={sectionLabelStyle}>Fitur Unggulan</p>
            <h2 style={sectionHeadingStyle}>Fitur Utama</h2>
            <p style={sectionSubtextStyle}>
              Semua yang dibutuhkan untuk mengelola distribusi TBS dari satu
              platform.
            </p>
          </div>
        </Reveal>

        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {FITUR_LIST.map((fitur, index) => (
            <div key={fitur.judul} className={`landing-feature-row${index % 2 === 1 ? " is-reverse" : ""}`}>
              <Reveal>
                <div>
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: "11px",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--color-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    FITUR {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3
                    style={{
                      margin: "0 0 14px",
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.6rem, 2.5vw, 2rem)",
                      fontWeight: "var(--font-weight-bold)",
                      letterSpacing: "-0.03em",
                      lineHeight: "1.2",
                      color: "#fff",
                    }}
                  >
                    {fitur.judul}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 28px",
                      fontSize: "15px",
                      lineHeight: "1.7",
                      color: "rgba(255,255,255,0.45)",
                      maxWidth: "380px",
                    }}
                  >
                    {fitur.deskripsi}
                  </p>
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {fitur.poin.map((item) => (
                      <li
                        key={item}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          fontSize: "14px",
                          color: "rgba(255,255,255,0.55)",
                          lineHeight: "1.5",
                        }}
                      >
                        <span style={{ flexShrink: 0, marginTop: "2px" }}>
                          <IkonCentang size={16} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={100} className="landing-feature-visual">
                <FiturVisual type={fitur.type} />
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      <section
        id="cara-kerja"
        style={{
          padding: "120px 48px",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ maxWidth: "640px", margin: "0 auto 80px" }}>
              <p style={sectionLabelStyle}>Cara Kerja</p>
              <h2 style={sectionHeadingStyle}>Cara Kerja</h2>
              <p style={sectionSubtextStyle}>
                Tiga langkah sederhana dari data hingga distribusi berjalan.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
            {LANGKAH_LIST.map((langkah, index) => (
              <Fragment key={langkah.nomor}>
                <Reveal
                  delay={index * 80}
                  style={{ flex: "0 1 220px", maxWidth: "220px", textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-surface-2)",
                      border: "1px solid var(--color-border-mid)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "16px",
                      margin: "0 auto 24px",
                    }}
                  >
                    {langkah.nomor}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "#fff",
                      marginBottom: "10px",
                    }}
                  >
                    {langkah.judul}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {langkah.deskripsi}
                  </p>
                </Reveal>

                {index < LANGKAH_LIST.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="landing-cara-kerja-connector"
                    style={{
                      flex: "1 1 40px",
                      minWidth: "24px",
                      maxWidth: "100px",
                      height: 0,
                      marginTop: "24px",
                      borderTop: "1px solid var(--color-border-mid)",
                      alignSelf: "flex-start",
                    }}
                  />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section
        id="peta"
        style={{
          padding: "120px 48px",
          backgroundColor: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ maxWidth: "640px", margin: "0 auto 56px" }}>
              <p style={sectionLabelStyle}>Jangkauan Distribusi</p>
              <h2 style={sectionHeadingStyle}>Peta Distribusi TBS</h2>
              <p style={sectionSubtextStyle}>
                Visualisasi geografis kota-kota yang dipantau Switera beserta volume
                permintaan saat ini.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div
              style={{
                border: "1px solid var(--color-border-mid)",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <PetaGeografis ranking={rankingDemo} daftarKota={daftarKotaDemo} />
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="faq"
        style={{
          padding: "120px 48px",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ maxWidth: "640px", margin: "0 auto 48px" }}>
              <p style={sectionLabelStyle}>FAQ</p>
              <h2 style={sectionHeadingStyle}>Pertanyaan Umum</h2>
              <p style={sectionSubtextStyle}>
                Jawaban singkat untuk pertanyaan yang paling sering diajukan.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div>
              {FAQ_LIST.map((faq, index) => (
                <FaqItem
                  key={faq.pertanyaan}
                  pertanyaan={faq.pertanyaan}
                  jawaban={faq.jawaban}
                  isOpen={openFaqIndex === index}
                  onToggle={() =>
                    setOpenFaqIndex((current) => (current === index ? -1 : index))
                  }
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "80px 48px",
          backgroundColor: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <HeroGlow flip />
        <Reveal style={{ position: "relative" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginBottom: "40px" }}>
              {TESTIMONIAL_CHIPS.map((chip) => (
                <span
                  key={chip.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "100px",
                    padding: "6px 14px 6px 8px",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: chip.avatarBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "var(--font-weight-bold)",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {chip.initial}
                  </span>
                  {chip.label}
                </span>
              ))}
            </div>
            <h2
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: "var(--font-weight-bold)",
                letterSpacing: "-0.04em",
                color: "#fff",
              }}
            >
              Siap Mengoptimalkan Distribusi TBS Anda?
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", margin: "12px 0 32px" }}>
              Bergabung dan mulai optimalkan distribusi TBS hari ini.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <LandingButton
                label="Daftar Sekarang"
                tone="primer"
                size="md"
                style={{ padding: "12px 28px", fontSize: "14px" }}
                onClick={openRegister}
              />
            </div>
          </div>
        </Reveal>
      </section>

      <footer
        style={{
          padding: "32px 48px",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
          <IkonDaun size={16} />
          <span>© 2026 Switera</span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.15)" }}>
          Dibuat untuk tugas Pengembangan Sistem Informasi
        </p>
      </footer>

      {showLoginModal ? (
        <Login onNavigate={onNavigate} onClose={() => setShowLoginModal(false)} onSwitchToRegister={openRegister} />
      ) : null}

      {showRegisterModal ? (
        <Register onNavigate={onNavigate} onClose={() => setShowRegisterModal(false)} onSwitchToLogin={openLogin} />
      ) : null}
    </div>
  );
}

export default Landing;
