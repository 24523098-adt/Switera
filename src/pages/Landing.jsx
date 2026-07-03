import { useEffect, useRef, useState } from "react";
import PetaGeografis from "../components/PetaGeografis";
import { apiFetch } from "../api/apiClient";

// Ikon Material Symbols (kelas dasar didefinisikan di tokens.css).
function Ikon({ name, size = 20, fill = false, style }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// Scroll reveal — menambahkan kelas .visible saat elemen masuk viewport.
function Reveal({ children, delay = 0, style }) {
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " visible" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontWeight: "var(--font-weight-bold)",
  color: "var(--color-on-background)",
  letterSpacing: "-0.01em",
  margin: 0,
};

const sectionSubStyle = {
  fontSize: "var(--text-md)",
  color: "var(--color-on-surface-variant)",
  margin: 0,
  lineHeight: 1.6,
};

const cardStyle = {
  backgroundColor: "var(--color-surface-container-lowest)",
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-sm)",
  padding: "var(--space-6)",
  height: "100%",
  boxSizing: "border-box",
};

const TICKER_ITEMS = [
  { ikon: "location_city", teks: "8 Kota Tujuan Distribusi" },
  { ikon: "scale", teks: "1.500+ Ton TBS Terkelola" },
  { ikon: "local_shipping", teks: "Pelacakan Status Real-time" },
  { ikon: "groups", teks: "3 Peran dalam Satu Platform" },
  { ikon: "insights", teks: "Ranking Kota Otomatis" },
  { ikon: "sync", teks: "Sinkron Multi-Pengguna < 4 Detik" },
];

const MASALAH = [
  { ikon: "edit_off", teks: "Pencatatan permintaan manual tercecer di banyak berkas" },
  { ikon: "psychology_alt", teks: "Kota tujuan dipilih berdasarkan tebakan, bukan data" },
  { ikon: "visibility_off", teks: "Status kiriman tidak terpantau setelah truk berangkat" },
];

const SOLUSI = [
  { ikon: "database", teks: "Satu sumber data permintaan untuk seluruh tim" },
  { ikon: "auto_awesome", teks: "Rekomendasi kota tujuan dihitung otomatis dari data" },
  { ikon: "share_location", teks: "Status tiap pengiriman terlacak sampai selesai" },
];

const FITUR = [
  {
    ikon: "trending_up",
    judul: "Ranking Kota Otomatis",
    deskripsi:
      "Sistem menghitung total permintaan tiap kota dan mengurutkannya otomatis. Urutan selalu ter-update setiap ada data baru — tanpa hitung manual.",
    poin: ["Skor gabungan permintaan & kapasitas", "Update otomatis setiap input baru"],
  },
  {
    ikon: "recommend",
    judul: "Rekomendasi Distribusi",
    deskripsi:
      "Saran kota tujuan dan alokasi tonase berbasis data permintaan, kapasitas kota, dan stok TBS yang tersedia.",
    poin: ["Alokasi menghormati batas stok", "Keputusan lebih cepat & terukur"],
  },
  {
    ikon: "local_shipping",
    judul: "Pelacakan Status Pengiriman",
    deskripsi:
      "Setiap keputusan distribusi dipantau dari Menunggu, Dalam Pengiriman, sampai Selesai — lengkap dengan armada dan estimasi tiba.",
    poin: ["Armada & ETA per pengiriman", "Riwayat waktu tiap perubahan status"],
  },
  {
    ikon: "description",
    judul: "Laporan & Ekspor Data",
    deskripsi:
      "Laporan tren permintaan dan status distribusi per peran, siap diekspor ke CSV untuk kebutuhan rekap dan arsip.",
    poin: ["Grafik tren per periode", "Ekspor CSV sekali klik"],
  },
  {
    ikon: "history",
    judul: "Riwayat Aktivitas Lengkap",
    deskripsi:
      "Semua aksi penting — input data, keputusan, perubahan stok — tercatat otomatis dengan pelaku dan waktunya.",
    poin: ["Jejak audit tiap perubahan", "Filter per peran & pencarian"],
  },
];

const CARA_KERJA = [
  { nomor: "1", ikon: "edit_note", judul: "Input Permintaan", deskripsi: "Catat permintaan TBS tiap kota beserta jumlah dan tanggalnya." },
  { nomor: "2", ikon: "insights", judul: "Hitung & Rekomendasi", deskripsi: "Sistem menyusun ranking kota dan merekomendasikan alokasi distribusi." },
  { nomor: "3", ikon: "local_shipping", judul: "Putuskan & Lacak", deskripsi: "Setujui keputusan distribusi lalu pantau statusnya sampai selesai." },
];

const ROLES = [
  { ikon: "admin_panel_settings", judul: "Admin", deskripsi: "Kelola data permintaan, kota, stok TBS, dan akun pengguna dari satu tempat." },
  { ikon: "insights", judul: "Manajer Distribusi", deskripsi: "Analisis ranking, buat keputusan distribusi, dan pantau laporan." },
  { ikon: "local_shipping", judul: "Tim Logistik", deskripsi: "Perbarui status pengiriman, armada, dan estimasi tiba di lapangan." },
  { ikon: "sync", judul: "Sinkron Bersama", deskripsi: "Semua peran melihat data yang sama, ter-update otomatis tanpa refresh." },
];

const TESTIMONI = [
  {
    nama: "Rudi Hartono",
    peran: "Manajer Distribusi",
    teks: "Rekomendasi kotanya masuk akal dan bisa dipertanggungjawabkan — rapat distribusi jadi jauh lebih singkat.",
  },
  {
    nama: "Sari Wulandari",
    peran: "Admin Operasional",
    teks: "Input permintaan dan rekap stok yang dulu makan waktu setengah hari sekarang selesai dalam hitungan menit.",
  },
  {
    nama: "Bima Prasetyo",
    peran: "Koordinator Logistik",
    teks: "Status tiap truk kelihatan jelas. Tidak ada lagi saling telepon hanya untuk tanya posisi kiriman.",
  },
];

const FAQ = [
  {
    q: "Apa itu TBS?",
    a: "TBS adalah Tandan Buah Segar — tandan buah kelapa sawit yang baru dipanen dan siap didistribusikan ke kota tujuan.",
  },
  {
    q: "Siapa saja yang bisa memakai Switera?",
    a: "Ada tiga peran: Admin (kelola data & akun), Manajer Distribusi (analisis & keputusan), dan Tim Logistik (status pengiriman). Setiap peran punya menu dan akses sendiri.",
  },
  {
    q: "Apakah data antar pengguna selalu sinkron?",
    a: "Ya. Semua data tersimpan di server dan setiap perubahan terlihat oleh pengguna lain dalam hitungan detik tanpa perlu refresh halaman.",
  },
  {
    q: "Bagaimana rekomendasi distribusi dihitung?",
    a: "Sistem menggabungkan total permintaan tiap kota dengan kapasitasnya, lalu mengalokasikan stok TBS yang tersedia mulai dari kota dengan skor tertinggi.",
  },
];

function Landing({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [demoTab, setDemoTab] = useState(0);
  const [rankingDemo, setRankingDemo] = useState([]);
  const [daftarKotaDemo, setDaftarKotaDemo] = useState([]);

  // Data peta dari endpoint publik (tanpa JWT — Landing tampil pra-login).
  useEffect(() => {
    let aktif = true;

    apiFetch("/public/landing-stats", { auth: false })
      .then((resp) => {
        if (!aktif || !resp) return;
        setRankingDemo(Array.isArray(resp.ranking) ? resp.ranking : []);
        setDaftarKotaDemo(Array.isArray(resp.daftarKota) ? resp.daftarKota : []);
      })
      .catch(() => {
        // Backend tidak terjangkau — peta dirender kosong, halaman tetap tampil.
      });

    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const goLogin = () => onNavigate?.("/login");
  const goRegister = () => onNavigate?.("/register");

  const navLinkStyle = {
    color: "var(--color-on-surface-variant)",
    textDecoration: "none",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-weight-semibold)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    padding: 0,
    transition: "color var(--transition-fast)",
  };

  const btnPrimer = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--color-primary)",
    color: "var(--color-on-primary)",
    border: "none",
    borderRadius: "var(--radius-lg)",
    fontFamily: "var(--font-body)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "var(--text-sm)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    transition:
      "transform var(--transition-slow), background-color var(--transition-slow), box-shadow var(--transition-slow)",
  };

  const demoTabs = [
    {
      label: "Dashboard",
      ikon: "dashboard",
      baris: [
        { k: "Total Permintaan", v: "1.240 ton" },
        { k: "Distribusi Aktif", v: "18 kiriman" },
        { k: "Stok TBS Tersedia", v: "450 ton" },
      ],
    },
    {
      label: "Ranking Kota",
      ikon: "trending_up",
      baris: [
        { k: "1. Pekanbaru", v: "Skor 96" },
        { k: "2. Medan", v: "Skor 88" },
        { k: "3. Palembang", v: "Skor 74" },
      ],
    },
    {
      label: "Status Kiriman",
      ikon: "local_shipping",
      baris: [
        { k: "Dumai — 120 ton", v: "Dalam Pengiriman" },
        { k: "Jambi — 90 ton", v: "Menunggu" },
        { k: "Padang — 150 ton", v: "Selesai" },
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-on-background)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ===== 1. Navbar ===== */}
      {/* Navbar glass ala ultimate_1/2 — padding menyusut saat scroll. */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-toast)",
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.3)",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          padding: scrolled ? "8px 0" : "16px 0",
          transition: "padding var(--transition-base), box-shadow var(--transition-base)",
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            padding: "0 var(--space-8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-primary-container)",
                color: "var(--color-on-primary-container)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Ikon name="eco" size={24} fill />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
              Switera
            </span>
          </div>

          <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("fitur")}>Fitur</button>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("cara-kerja")}>Cara Kerja</button>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("peta")}>Peta</button>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("demo")}>Demo</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              type="button"
              onClick={goLogin}
              style={{ ...navLinkStyle, color: "var(--color-on-surface)", padding: "8px 16px", borderRadius: "var(--radius-md)" }}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={goRegister}
              style={{
                ...btnPrimer,
                padding: "10px 24px",
                borderRadius: "var(--radius-full)",
                boxShadow: "0 1px 8px rgba(0,106,67,0.2)",
              }}
            >
              Daftar
            </button>
          </div>
        </div>
      </nav>

      {/* ===== 2. Hero ===== */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #f8f9ff 100%)",
          paddingTop: "128px",
          paddingBottom: "80px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", top: "80px", right: 0, width: "384px", height: "384px", background: "rgba(0,134,86,0.10)", borderRadius: "50%", filter: "blur(64px)", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: 0, left: "40px", width: "288px", height: "288px", background: "rgba(196,231,255,0.3)", borderRadius: "50%", filter: "blur(64px)", opacity: 0.6 }} />

        <div
          className="landing-hero-grid"
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            padding: "0 var(--space-8)",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
            gap: "48px",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid var(--color-outline-variant)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Ping dot dua lapis ala Tailwind animate-ping. */}
              <span style={{ position: "relative", display: "flex", width: "12px", height: "12px" }}>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.75,
                    animation: "pingDot 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <span style={{ position: "relative", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
              </span>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--color-on-surface-variant)" }}>
                Platform Distribusi Tandan Buah Segar (TBS) Terpercaya
              </span>
            </div>

            <h1 style={{ ...headingStyle, fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Kelola Distribusi TBS Lebih Cerdas dengan Data{" "}
              <span
                style={{
                  background: "linear-gradient(to right, #006a43, #70dba2)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Real-Time
              </span>
            </h1>

            <p style={{ ...sectionSubStyle, fontSize: "var(--text-lg)", maxWidth: "36rem" }}>
              Tingkatkan efisiensi logistik kelapa sawit Anda. Pantau ranking, alokasi armada, dan status
              pengiriman secara akurat dalam satu dashboard terintegrasi.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={goRegister}
                style={{
                  ...btnPrimer,
                  padding: "16px 32px",
                  fontSize: "var(--text-base)",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "0 4px 16px rgba(0,106,67,0.25)",
                }}
              >
                Mulai Sekarang
                <Ikon name="arrow_forward" size={20} />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("demo")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 32px",
                  borderRadius: "var(--radius-xl)",
                  border: "2px solid var(--color-outline-variant)",
                  backgroundColor: "var(--color-surface-container-lowest)",
                  color: "var(--color-on-surface)",
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-semibold)",
                  fontSize: "var(--text-base)",
                  cursor: "pointer",
                  transition: "background-color var(--transition-fast), border-color var(--transition-fast)",
                }}
              >
                <Ikon name="play_circle" size={20} fill />
                Tonton Demo
              </button>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex" }}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "2px solid var(--color-surface-container-lowest)",
                      backgroundColor: "var(--color-surface-container)",
                      color: "var(--color-primary)",
                      display: "grid",
                      placeItems: "center",
                      marginLeft: i === 0 ? 0 : "-12px",
                    }}
                  >
                    <Ikon name="person" size={20} fill />
                  </span>
                ))}
                <span
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-surface-container-lowest)",
                    backgroundColor: "var(--color-surface-container-high)",
                    color: "var(--color-on-surface)",
                    display: "grid",
                    placeItems: "center",
                    marginLeft: "-12px",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-bold)",
                  }}
                >
                  +5k
                </span>
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)" }}>
                Dipercaya oleh ribuan profesional logistik.
              </div>
            </div>
          </div>

          {/* Mockup dashboard mengambang ala ultimate_1/2. */}
          <div className="landing-hero-mockup" style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(140,248,189,0.20)", filter: "blur(80px)", borderRadius: "50%", transform: "translateY(-40px) scale(1.1)" }} />
            <div
              style={{
                position: "relative",
                backgroundColor: "var(--color-surface-container-lowest)",
                borderRadius: "var(--radius-2xl)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--color-surface-container-high)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                zIndex: 1,
                animation: "heroFloat 6s ease-in-out infinite",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-surface-container-high)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(0,134,86,0.1)", display: "grid", placeItems: "center", color: "var(--color-primary)" }}>
                    <Ikon name="trending_up" size={20} />
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>Ranking Distribusi</div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-on-surface-variant)" }}>Live Update</div>
                  </div>
                </div>
                <span style={{ backgroundColor: "rgba(0,134,86,0.2)", color: "var(--color-primary)", padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)" }}>
                  Selesai
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { k: "Pekanbaru - Riau", v: "120 Ton", warna: "var(--color-primary)" },
                  { k: "Medan - Sumut", v: "85 Ton", warna: "var(--color-secondary)" },
                ].map((row) => (
                  <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container-low)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Ikon name="location_on" size={18} style={{ color: "var(--color-outline)" }} />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-on-surface)" }}>{row.k}</span>
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: row.warna }}>{row.v}</span>
                  </div>
                ))}

                {/* Grafik area SVG ala ultimate. */}
                <div style={{ height: "96px", backgroundColor: "var(--color-surface-container)", borderRadius: "var(--radius-lg)", position: "relative", overflow: "hidden", marginTop: "8px" }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
                    <path d="M0,100 L20,60 L40,80 L60,40 L80,50 L100,20 L100,100 Z" fill="#eaf1ff" />
                    <path d="M0,100 L20,60 L40,80 L60,40 L80,50 L100,20" fill="none" stroke="#006a43" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chip status melayang. */}
            <div
              style={{
                position: "absolute",
                right: "-24px",
                top: "40px",
                backgroundColor: "var(--color-surface-container-lowest)",
                padding: "12px",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--color-surface-container)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 2,
                animation: "heroFloat 6s ease-in-out 1s infinite",
              }}
            >
              <span style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(64,194,253,0.2)", display: "grid", placeItems: "center", color: "var(--color-secondary)" }}>
                <Ikon name="check_circle" size={22} />
              </span>
              <div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-on-surface-variant)" }}>Status</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-surface)" }}>Terkonfirmasi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. Stats ticker ===== */}
      <section style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-container-lowest)", overflow: "hidden", padding: "16px 0" }}>
        <div className="animate-ticker" style={{ display: "flex", gap: "48px", width: "max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap", color: "var(--color-on-surface-variant)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)" }}>
              <Ikon name={item.ikon} size={18} style={{ color: "var(--color-primary)" }} />
              {item.teks}
            </span>
          ))}
        </div>
      </section>

      {/* ===== 4. Problem vs Solution ===== */}
      <section style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "42rem", margin: "0 auto 48px" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>
              Dari cara lama yang melelahkan, ke alur kerja berbasis data
            </h2>
          </div>
        </Reveal>
        <div className="app-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          <Reveal>
            <div style={{ ...cardStyle, borderTop: "4px solid var(--color-tertiary)" }}>
              <h3 style={{ ...headingStyle, fontSize: "var(--text-lg)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Ikon name="report_problem" size={22} style={{ color: "var(--color-tertiary)" }} fill />
                Tanpa Switera
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {MASALAH.map((m) => (
                  <div key={m.teks} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Ikon name={m.ikon} size={20} style={{ color: "var(--color-tertiary)", marginTop: "2px" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>{m.teks}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ ...cardStyle, borderTop: "4px solid var(--color-primary)" }}>
              <h3 style={{ ...headingStyle, fontSize: "var(--text-lg)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Ikon name="verified" size={22} style={{ color: "var(--color-primary)" }} fill />
                Dengan Switera
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {SOLUSI.map((s) => (
                  <div key={s.teks} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Ikon name={s.ikon} size={20} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>{s.teks}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 5. Fitur utama (alternating) ===== */}
      <section id="fitur" style={{ backgroundColor: "var(--color-surface-container-low)", padding: "80px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 56px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Fitur Utama</h2>
              <p style={sectionSubStyle}>Semua yang dibutuhkan untuk mengelola distribusi TBS dari satu platform.</p>
            </div>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {FITUR.map((item, i) => (
              <Reveal key={item.judul} delay={60}>
                <div
                  className="landing-fitur-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "40px",
                    alignItems: "center",
                    direction: i % 2 === 1 ? "rtl" : "ltr",
                  }}
                >
                  <div style={{ direction: "ltr" }}>
                    <span style={{ width: "52px", height: "52px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container)", color: "var(--color-primary)", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                      <Ikon name={item.ikon} size={26} fill />
                    </span>
                    <h3 style={{ ...headingStyle, fontSize: "var(--text-xl)", marginBottom: "10px" }}>{item.judul}</h3>
                    <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", marginBottom: "14px" }}>{item.deskripsi}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {item.poin.map((p) => (
                        <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", color: "var(--color-on-surface)" }}>
                          <Ikon name="check_circle" size={16} style={{ color: "var(--color-primary)" }} fill />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ direction: "ltr", backgroundColor: "var(--color-surface-container-lowest)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "24px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ikon name={item.ikon} size={72} style={{ color: "var(--color-surface-container-high)" }} fill />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. Peta distribusi ===== */}
      <section id="peta" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 40px" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Peta Distribusi TBS</h2>
            <p style={sectionSubStyle}>Sebaran kota tujuan distribusi di Sumatera — ukuran lingkaran mengikuti total permintaan.</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ ...cardStyle, padding: "var(--space-4)", overflow: "hidden" }}>
            <PetaGeografis ranking={rankingDemo} daftarKota={daftarKotaDemo} />
          </div>
        </Reveal>
      </section>

      {/* ===== 7. Cara kerja ===== */}
      <section id="cara-kerja" style={{ backgroundColor: "var(--color-surface-container-low)", padding: "80px 0" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Cara Kerja</h2>
              <p style={sectionSubStyle}>Tiga langkah sederhana dari data ke keputusan distribusi.</p>
            </div>
          </Reveal>
          <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
            {CARA_KERJA.map((step, i) => (
              <Reveal key={step.nomor} delay={i * 100}>
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: "var(--font-weight-bold)" }}>
                      {step.nomor}
                    </span>
                    <Ikon name={step.ikon} size={24} style={{ color: "var(--color-primary)" }} fill />
                  </div>
                  <h3 style={{ ...headingStyle, fontSize: "var(--text-lg)", marginBottom: "8px" }}>{step.judul}</h3>
                  <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)" }}>{step.deskripsi}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. Role showcase ===== */}
      <section style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Satu Platform, Semua Peran</h2>
            <p style={sectionSubStyle}>Setiap peran mendapat tampilan dan alat yang sesuai kebutuhannya.</p>
          </div>
        </Reveal>
        <div className="app-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-6)" }}>
          {ROLES.map((role, i) => (
            <Reveal key={role.judul} delay={i * 80}>
              <div className="app-card app-card-hoverable" style={cardStyle}>
                <span style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container)", color: "var(--color-primary)", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                  <Ikon name={role.ikon} size={24} fill />
                </span>
                <h3 style={{ ...headingStyle, fontSize: "var(--text-md)", marginBottom: "8px" }}>{role.judul}</h3>
                <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)" }}>{role.deskripsi}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 9. Demo preview (tab switching) ===== */}
      <section id="demo" style={{ backgroundColor: "var(--color-surface-container-low)", padding: "80px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 32px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Lihat Sekilas</h2>
              <p style={sectionSubStyle}>Cuplikan tampilan yang akan digunakan tim Anda setiap hari.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
                {demoTabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setDemoTab(i)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "14px",
                      border: "none",
                      borderBottom: demoTab === i ? "3px solid var(--color-primary)" : "3px solid transparent",
                      backgroundColor: demoTab === i ? "var(--color-surface-container-low)" : "transparent",
                      color: demoTab === i ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-semibold)",
                      cursor: "pointer",
                      transition: "color var(--transition-fast), border-color var(--transition-fast)",
                    }}
                  >
                    <Ikon name={tab.ikon} size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div key={demoTab} className="animate-fade-in" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "10px" }}>
                {demoTabs[demoTab].baris.map((row) => (
                  <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container-low)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface)" }}>{row.k}</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 10. Stats achievements (bg hijau) ===== */}
      <section style={{ backgroundColor: "var(--color-primary)", padding: "64px 0" }}>
        <div className="app-grid-4" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 var(--space-8)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-6)", textAlign: "center" }}>
          {[
            { angka: "8", label: "Kota Tujuan" },
            { angka: "1.500+", label: "Ton TBS Terkelola" },
            { angka: "3", label: "Peran Terintegrasi" },
            { angka: "< 4 dtk", label: "Sinkron Antar Pengguna" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-primary)" }}>{s.angka}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 11. Testimonial ===== */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Apa Kata Pengguna</h2>
          </div>
        </Reveal>
        <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
          {TESTIMONI.map((t, i) => (
            <Reveal key={t.nama} delay={i * 100}>
              <div style={{ ...cardStyle, borderTop: "4px solid var(--color-primary)" }}>
                <Ikon name="format_quote" size={28} style={{ color: "var(--color-surface-container-high)" }} fill />
                <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", margin: "10px 0 20px", fontStyle: "italic" }}>
                  “{t.teks}”
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-surface-container)", color: "var(--color-primary)", display: "grid", placeItems: "center", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-sm)" }}>
                    {t.nama.split(" ").map((k) => k[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-surface)" }}>{t.nama}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)" }}>{t.peran}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 12. FAQ accordion ===== */}
      <section id="faq" style={{ backgroundColor: "var(--color-surface-container-low)", padding: "80px 0" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", margin: "0 auto 40px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2rem)", marginBottom: "12px" }}>Pertanyaan Umum</h2>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQ.map((item, i) => {
              const open = openFaqIndex === i;
              return (
                <Reveal key={item.q} delay={i * 60}>
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(open ? -1 : i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "18px 20px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--text-md)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: open ? "var(--color-primary)" : "var(--color-on-surface)",
                        textAlign: "left",
                      }}
                    >
                      {item.q}
                      <Ikon name={open ? "remove" : "add"} size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    </button>
                    {open ? (
                      <p className="animate-fade-in" style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", padding: "0 20px 18px", margin: 0 }}>
                        {item.a}
                      </p>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 13. CTA final ===== */}
      <section style={{ padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ maxWidth: "1100px", margin: "0 auto", backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-2xl)", padding: "clamp(40px, 6vw, 72px)", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "var(--color-on-primary)", marginBottom: "12px" }}>
              Siap mengoptimalkan distribusi TBS Anda?
            </h2>
            <p style={{ fontSize: "var(--text-md)", color: "rgba(255,255,255,0.85)", margin: "0 0 28px" }}>
              Mulai kelola distribusi kelapa sawit dengan lebih cepat, tepat, dan terukur.
            </p>
            <button
              type="button"
              onClick={goRegister}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--color-surface-container-lowest)",
                color: "var(--color-primary)",
                border: "none",
                borderRadius: "var(--radius-lg)",
                padding: "16px 32px",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--text-base)",
                cursor: "pointer",
                boxShadow: "var(--shadow-md)",
              }}
            >
              Daftar Sekarang
              <Ikon name="arrow_forward" size={20} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ===== 14. Footer multi kolom ===== */}
      <footer style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div className="app-grid-4" style={{ maxWidth: "1440px", margin: "0 auto", padding: "56px var(--space-8) 32px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--space-8)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ width: "36px", height: "36px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)", display: "grid", placeItems: "center" }}>
                <Ikon name="eco" size={20} fill />
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>Switera</span>
            </div>
            <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", maxWidth: "22rem" }}>
              Platform manajemen distribusi Tandan Buah Segar (TBS) kelapa sawit — dari permintaan sampai pengiriman.
            </p>
          </div>
          {[
            { judul: "Produk", link: [["Fitur", "fitur"], ["Peta Distribusi", "peta"], ["Demo", "demo"]] },
            { judul: "Panduan", link: [["Cara Kerja", "cara-kerja"], ["FAQ", "faq"]] },
            { judul: "Akses", link: null },
          ].map((kolom) => (
            <div key={kolom.judul}>
              <h4 style={{ ...headingStyle, fontSize: "var(--text-sm)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-on-surface-variant)" }}>
                {kolom.judul}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                {kolom.link
                  ? kolom.link.map(([label, id]) => (
                      <button key={id} type="button" style={{ ...navLinkStyle, fontWeight: "var(--font-weight-normal)" }} onClick={() => scrollToId(id)}>
                        {label}
                      </button>
                    ))
                  : (
                    <>
                      <button type="button" style={{ ...navLinkStyle, fontWeight: "var(--font-weight-normal)" }} onClick={goLogin}>Masuk</button>
                      <button type="button" style={{ ...navLinkStyle, fontWeight: "var(--font-weight-normal)" }} onClick={goRegister}>Daftar</button>
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px var(--space-8)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>
            © Switera 2026 — Platform Manajemen Distribusi TBS Kelapa Sawit.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
