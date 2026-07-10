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

// Scroll reveal, menambahkan kelas .visible saat elemen masuk viewport.
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
  color: "#111111",
  letterSpacing: "-0.03em",
  margin: 0,
};

const sectionSubStyle = {
  fontSize: "var(--text-md)",
  color: "var(--color-on-surface-variant)",
  margin: 0,
  lineHeight: 1.6,
  fontWeight: "var(--font-weight-medium)",
};

// Kartu Neo-Brutalism: border hitam 2px, hard shadow, radius besar.
const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "var(--radius-2xl)",
  border: "2px solid #000000",
  boxShadow: "var(--shadow-md)",
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
      "Sistem menghitung total permintaan tiap kota dan mengurutkannya otomatis. Urutan selalu ter-update setiap ada data baru, tanpa hitung manual.",
    poin: ["Skor gabungan permintaan dan kapasitas", "Update otomatis setiap input baru"],
  },
  {
    ikon: "recommend",
    judul: "Rekomendasi Distribusi",
    deskripsi:
      "Saran kota tujuan dan alokasi tonase berbasis data permintaan, kapasitas kota, dan stok TBS yang tersedia.",
    poin: ["Alokasi menghormati batas stok", "Keputusan lebih cepat dan terukur"],
  },
  {
    ikon: "local_shipping",
    judul: "Pelacakan Status Pengiriman",
    deskripsi:
      "Setiap keputusan distribusi dipantau dari Menunggu, Dalam Pengiriman, sampai Selesai, lengkap dengan armada dan estimasi tiba.",
    poin: ["Armada dan ETA per pengiriman", "Riwayat waktu tiap perubahan status"],
  },
  {
    ikon: "description",
    judul: "Laporan dan Ekspor Data",
    deskripsi:
      "Laporan tren permintaan dan status distribusi per peran, siap diekspor ke CSV untuk kebutuhan rekap dan arsip.",
    poin: ["Grafik tren per periode", "Ekspor CSV sekali klik"],
  },
  {
    ikon: "history",
    judul: "Riwayat Aktivitas Lengkap",
    deskripsi:
      "Semua aksi penting, yaitu input data, keputusan, serta perubahan stok, tercatat otomatis dengan pelaku dan waktunya.",
    poin: ["Jejak audit tiap perubahan", "Filter per peran dan pencarian"],
  },
];

const CARA_KERJA = [
  { nomor: "1", ikon: "edit_note", judul: "Input Permintaan", deskripsi: "Catat permintaan TBS tiap kota beserta jumlah dan tanggalnya." },
  { nomor: "2", ikon: "insights", judul: "Hitung dan Rekomendasi", deskripsi: "Sistem menyusun ranking kota dan merekomendasikan alokasi distribusi." },
  { nomor: "3", ikon: "local_shipping", judul: "Putuskan dan Lacak", deskripsi: "Setujui keputusan distribusi lalu pantau statusnya sampai selesai." },
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
    teks: "Rekomendasi kotanya masuk akal dan bisa dipertanggungjawabkan. Rapat distribusi jadi jauh lebih singkat.",
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
    a: "TBS adalah Tandan Buah Segar, yaitu tandan buah kelapa sawit yang baru dipanen dan siap didistribusikan ke kota tujuan.",
  },
  {
    q: "Siapa saja yang bisa memakai Switera?",
    a: "Ada tiga peran: Admin (kelola data dan akun), Manajer Distribusi (analisis dan keputusan), serta Tim Logistik (status pengiriman). Setiap peran punya menu dan akses sendiri.",
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

  // Data peta dari endpoint publik (tanpa JWT, Landing tampil pra-login).
  useEffect(() => {
    let aktif = true;

    apiFetch("/public/landing-stats", { auth: false })
      .then((resp) => {
        if (!aktif || !resp) return;
        setRankingDemo(Array.isArray(resp.ranking) ? resp.ranking : []);
        setDaftarKotaDemo(Array.isArray(resp.daftarKota) ? resp.daftarKota : []);
      })
      .catch(() => {
        // Backend tidak terjangkau, peta dirender kosong dan halaman tetap tampil.
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
    fontWeight: "var(--font-weight-bold)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    padding: 0,
    transition: "color var(--transition-fast)",
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
        { k: "Dumai, 120 ton", v: "Dalam Pengiriman" },
        { k: "Jambi, 90 ton", v: "Menunggu" },
        { k: "Padang, 150 ton", v: "Selesai" },
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: "#ffffff", color: "var(--color-on-background)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ===== 1. Navbar sticky border hitam (beranda neo brutalist) ===== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-toast)",
          backgroundColor: "#ffffff",
          borderBottom: "2px solid #000000",
          boxShadow: scrolled ? "0px 4px 0px 0px #000000" : "none",
          padding: scrolled ? "8px 0" : "14px 0",
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
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-lime)",
                border: "2px solid #000000",
                boxShadow: "var(--shadow-sm)",
                color: "#000000",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Ikon name="eco" size={24} fill />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", letterSpacing: "-0.03em", color: "#000000" }}>
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
              style={{ ...navLinkStyle, color: "#000000", padding: "8px 16px" }}
            >
              Masuk
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-primer"
              onClick={goRegister}
              style={{ padding: "10px 24px", fontSize: "var(--text-sm)" }}
            >
              Daftar
            </button>
          </div>
        </div>
      </nav>

      {/* ===== 2. Hero terpusat ala beranda neo brutalist ===== */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          paddingTop: "150px",
          paddingBottom: "80px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 var(--space-8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-pastel)",
              border: "2px solid #000000",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "28px",
            }}
          >
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
              <span style={{ position: "relative", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-primary)", border: "1px solid #000" }} />
            </span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "#000000" }}>
              Platform Distribusi Tandan Buah Segar (TBS)
            </span>
          </div>

          <h1
            style={{
              ...headingStyle,
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              maxWidth: "56rem",
              marginBottom: "28px",
            }}
          >
            Distribusi TBS{" "}
            <span
              style={{
                backgroundColor: "var(--color-lime-bold)",
                padding: "0 12px",
                borderRadius: "var(--radius-md)",
                display: "inline-block",
                transform: "rotate(-2deg)",
                border: "2px solid #000000",
              }}
            >
              Lebih Cerdas
            </span>
            , Terlacak Penuh.
          </h1>

          <p style={{ ...sectionSubStyle, fontSize: "var(--text-lg)", maxWidth: "42rem", marginBottom: "32px" }}>
            Pantau permintaan, ranking kota, alokasi armada, dan status pengiriman kelapa sawit
            secara akurat dalam satu dashboard terintegrasi.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <button
              type="button"
              className="landing-btn landing-btn-primer"
              onClick={goRegister}
              style={{ padding: "16px 34px", fontSize: "var(--text-md)", boxShadow: "var(--shadow-lg)" }}
            >
              Mulai Sekarang
              <Ikon name="arrow_forward" size={20} />
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-sekunder"
              onClick={() => scrollToId("demo")}
              style={{ padding: "16px 34px", fontSize: "var(--text-md)" }}
            >
              <Ikon name="play_circle" size={20} fill />
              Lihat Demo
            </button>
          </div>

          {/* Mockup dashboard: kartu miring 1 derajat dengan border tebal */}
          <div
            style={{
              marginTop: "72px",
              width: "100%",
              maxWidth: "960px",
              borderRadius: "var(--radius-2xl)",
              backgroundColor: "#ffffff",
              padding: "10px",
              border: "3px solid #000000",
              boxShadow: "var(--shadow-lg)",
              transform: "rotate(1deg)",
              transition: "transform 500ms var(--ease-spring)",
            }}
            onMouseEnter={(event) => { event.currentTarget.style.transform = "rotate(0deg)"; }}
            onMouseLeave={(event) => { event.currentTarget.style.transform = "rotate(1deg)"; }}
          >
            <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "2px solid #000000", backgroundColor: "var(--color-surface-container-low)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #000000", padding: "14px 18px", backgroundColor: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-lime)", border: "2px solid #000", display: "grid", placeItems: "center", color: "#000" }}>
                    <Ikon name="trending_up" size={20} />
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "#000" }}>Ranking Distribusi</div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-on-surface-variant)" }}>Live Update</div>
                  </div>
                </div>
                <span style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success-text)", padding: "4px 14px", borderRadius: "var(--radius-full)", border: "2px solid #000", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)" }}>
                  Selesai
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "18px" }}>
                {[
                  { k: "Pekanbaru - Riau", v: "120 Ton" },
                  { k: "Medan - Sumut", v: "85 Ton" },
                ].map((row) => (
                  <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "var(--radius-lg)", backgroundColor: "#ffffff", border: "2px solid #000000", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Ikon name="location_on" size={18} style={{ color: "#000" }} />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "#000" }}>{row.k}</span>
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>{row.v}</span>
                  </div>
                ))}

                <div style={{ height: "96px", backgroundColor: "#ffffff", border: "2px solid #000000", borderRadius: "var(--radius-lg)", position: "relative", overflow: "hidden", marginTop: "4px" }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
                    <path d="M0,100 L20,60 L40,80 L60,40 L80,50 L100,20 L100,100 Z" fill="#eafcc2" />
                    <path d="M0,100 L20,60 L40,80 L60,40 L80,50 L100,20" fill="none" stroke="#000000" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. Stats strip border-y hitam dengan angka lime ===== */}
      <section style={{ borderTop: "2px solid #000000", borderBottom: "2px solid #000000", backgroundColor: "var(--color-surface-container-low)", overflow: "hidden", padding: "18px 0" }}>
        <div className="animate-ticker" style={{ display: "flex", gap: "48px", width: "max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap", color: "#000000", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>
              Dari cara lama yang melelahkan, ke alur kerja berbasis data
            </h2>
          </div>
        </Reveal>
        <div className="app-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          <Reveal>
            <div style={{ ...cardStyle, backgroundColor: "var(--color-danger-bg)" }}>
              <h3 style={{ ...headingStyle, fontSize: "var(--text-lg)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Ikon name="report_problem" size={22} style={{ color: "var(--color-danger-text)" }} fill />
                Tanpa Switera
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {MASALAH.map((m) => (
                  <div key={m.teks} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Ikon name={m.ikon} size={20} style={{ color: "var(--color-danger-text)", marginTop: "2px" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "#111", fontWeight: "var(--font-weight-medium)", lineHeight: 1.6 }}>{m.teks}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ ...cardStyle, backgroundColor: "var(--color-pastel-card)" }}>
              <h3 style={{ ...headingStyle, fontSize: "var(--text-lg)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Ikon name="verified" size={22} style={{ color: "var(--color-primary)" }} fill />
                Dengan Switera
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {SOLUSI.map((s) => (
                  <div key={s.teks} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Ikon name={s.ikon} size={20} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "#111", fontWeight: "var(--font-weight-medium)", lineHeight: 1.6 }}>{s.teks}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 5. Fitur utama (alternating) ===== */}
      <section id="fitur" style={{ backgroundColor: "var(--color-surface-container-low)", borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "80px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 56px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Fitur Utama</h2>
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
                    <span style={{ width: "56px", height: "56px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-lime)", border: "2px solid #000", boxShadow: "var(--shadow-sm)", color: "#000", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                      <Ikon name={item.ikon} size={28} fill />
                    </span>
                    <h3 style={{ ...headingStyle, fontSize: "var(--text-xl)", marginBottom: "10px" }}>{item.judul}</h3>
                    <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", marginBottom: "14px" }}>{item.deskripsi}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {item.poin.map((p) => (
                        <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "#111" }}>
                          <Ikon name="check_circle" size={16} style={{ color: "var(--color-primary)" }} fill />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ direction: "ltr", backgroundColor: i % 2 === 1 ? "var(--color-pastel-card)" : "#ffffff", border: "2px solid #000000", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-md)", padding: "24px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: "120px", height: "120px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-pastel)", border: "2px solid #000", display: "grid", placeItems: "center", transform: "rotate(12deg)" }}>
                      <Ikon name={item.ikon} size={64} style={{ color: "var(--color-primary)" }} fill />
                    </span>
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
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Peta Distribusi TBS</h2>
            <p style={sectionSubStyle}>Sebaran kota tujuan distribusi di Sumatera. Ukuran lingkaran mengikuti total permintaan.</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ ...cardStyle, padding: "var(--space-4)", overflow: "hidden" }}>
            <PetaGeografis ranking={rankingDemo} daftarKota={daftarKotaDemo} />
          </div>
        </Reveal>
      </section>

      {/* ===== 7. Cara kerja ===== */}
      <section id="cara-kerja" style={{ backgroundColor: "var(--color-surface-container-low)", borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "80px 0" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Cara Kerja</h2>
              <p style={sectionSubStyle}>Tiga langkah sederhana dari data ke keputusan distribusi.</p>
            </div>
          </Reveal>
          <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
            {CARA_KERJA.map((step, i) => (
              <Reveal key={step.nomor} delay={i * 100}>
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ width: "44px", height: "44px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-lime)", border: "2px solid #000", boxShadow: "var(--shadow-sm)", color: "#000", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-md)" }}>
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
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Satu Platform, Semua Peran</h2>
            <p style={sectionSubStyle}>Setiap peran mendapat tampilan dan alat yang sesuai kebutuhannya.</p>
          </div>
        </Reveal>
        <div className="app-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-6)" }}>
          {ROLES.map((role, i) => (
            <Reveal key={role.judul} delay={i * 80}>
              <div className="app-card app-card-hoverable" style={cardStyle}>
                <span style={{ width: "52px", height: "52px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-pastel)", border: "2px solid #000", color: "var(--color-primary)", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                  <Ikon name={role.ikon} size={26} fill />
                </span>
                <h3 style={{ ...headingStyle, fontSize: "var(--text-md)", marginBottom: "8px" }}>{role.judul}</h3>
                <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)" }}>{role.deskripsi}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 9. Demo preview (tab switching) ===== */}
      <section id="demo" style={{ backgroundColor: "var(--color-surface-container-low)", borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "80px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 32px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Lihat Sekilas</h2>
              <p style={sectionSubStyle}>Cuplikan tampilan yang akan digunakan tim Anda setiap hari.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "2px solid #000000" }}>
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
                      borderRight: i < demoTabs.length - 1 ? "2px solid #000000" : "none",
                      backgroundColor: demoTab === i ? "var(--color-lime)" : "transparent",
                      color: "#000000",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-bold)",
                      cursor: "pointer",
                      transition: "background-color var(--transition-fast)",
                    }}
                  >
                    <Ikon name={tab.ikon} size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div key={demoTab} className="animate-fade-in" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "10px" }}>
                {demoTabs[demoTab].baris.map((row) => (
                  <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-pastel)", border: "2px solid #000000" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "#111" }}>{row.k}</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 10. Stats achievements (angka lime, drop shadow hitam) ===== */}
      <section style={{ backgroundColor: "#ffffff", padding: "64px 0" }}>
        <div className="app-grid-4" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 var(--space-8)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-6)", textAlign: "center" }}>
          {[
            { angka: "8", label: "Kota Tujuan" },
            { angka: "1.500+", label: "Ton TBS Terkelola" },
            { angka: "3", label: "Peran Terintegrasi" },
            { angka: "1", label: "Sumber Data Terpusat" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "var(--color-lime-bold)",
                    textShadow: "2px 2px 0 #000000",
                    WebkitTextStroke: "1px #000000",
                  }}
                >
                  {s.angka}
                </div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#000000", marginTop: "6px" }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 11. Testimonial ===== */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--space-8) 80px" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Apa Kata Pengguna</h2>
          </div>
        </Reveal>
        <div className="app-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
          {TESTIMONI.map((t, i) => (
            <Reveal key={t.nama} delay={i * 100}>
              <div style={cardStyle}>
                <Ikon name="format_quote" size={28} style={{ color: "var(--color-lime-dim)" }} fill />
                <p style={{ ...sectionSubStyle, fontSize: "var(--text-sm)", margin: "10px 0 20px", fontStyle: "italic" }}>
                  “{t.teks}”
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-lime)", border: "2px solid #000", color: "#000", display: "grid", placeItems: "center", fontWeight: "var(--font-weight-bold)", fontSize: "var(--text-sm)" }}>
                    {t.nama.split(" ").map((k) => k[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "#111" }}>{t.nama}</div>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-primary)" }}>{t.peran}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== 12. FAQ accordion ===== */}
      <section id="faq" style={{ backgroundColor: "var(--color-surface-container-low)", borderTop: "2px solid #000", padding: "80px 0" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", margin: "0 auto 40px" }}>
              <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", marginBottom: "12px" }}>Pertanyaan Umum</h2>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FAQ.map((item, i) => {
              const open = openFaqIndex === i;
              return (
                <Reveal key={item.q} delay={i * 60}>
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden", backgroundColor: open ? "var(--color-pastel-card)" : "#ffffff" }}>
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
                        fontWeight: "var(--font-weight-bold)",
                        letterSpacing: "-0.02em",
                        color: "#111111",
                        textAlign: "left",
                      }}
                    >
                      {item.q}
                      <span style={{ width: "28px", height: "28px", flexShrink: 0, borderRadius: "var(--radius-full)", backgroundColor: open ? "var(--color-lime)" : "#fff", border: "2px solid #000", display: "grid", placeItems: "center" }}>
                        <Ikon name={open ? "remove" : "add"} size={18} style={{ color: "#000" }} />
                      </span>
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

      {/* ===== 13. CTA final: section lime penuh ala beranda neo brutalist ===== */}
      <section style={{ backgroundColor: "var(--color-lime-bold)", borderTop: "2px solid #000000", borderBottom: "2px solid #000000", padding: "80px var(--space-8)", position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", top: "-40px", left: "-40px", width: "128px", height: "128px", borderRadius: "50%", border: "4px solid #000", backgroundColor: "#fff", opacity: 0.2 }} />
        <span aria-hidden="true" style={{ position: "absolute", bottom: "-40px", right: "-40px", width: "192px", height: "192px", borderRadius: "50%", border: "4px solid #000", backgroundColor: "#fff", opacity: 0.2 }} />
        <Reveal>
          <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h2 style={{ ...headingStyle, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: "#141f00", marginBottom: "14px" }}>
              Siap mengubah operasional distribusi TBS Anda?
            </h2>
            <p style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-weight-medium)", color: "#141f00", opacity: 0.9, margin: "0 0 32px" }}>
              Mulai kelola distribusi kelapa sawit dengan lebih cepat, tepat, dan terukur bersama Switera.
            </p>
            <button
              type="button"
              onClick={goRegister}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#ffffff",
                color: "#000000",
                border: "3px solid #000000",
                borderRadius: "var(--radius-full)",
                padding: "18px 40px",
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--text-md)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
                boxShadow: "var(--shadow-lg)",
                transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
              }}
              onMouseEnter={(event) => { event.currentTarget.style.transform = "translate(2px, 2px)"; event.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = "translate(0, 0)"; event.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
            >
              Daftar Sekarang
              <Ikon name="arrow_forward" size={20} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ===== 14. Footer gelap ala beranda neo brutalist ===== */}
      <footer style={{ backgroundColor: "#191a23", color: "#ffffff" }}>
        <div className="app-grid-4" style={{ maxWidth: "1440px", margin: "0 auto", padding: "56px var(--space-8) 32px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--space-8)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ width: "36px", height: "36px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-lime)", border: "2px solid #000", color: "#000", display: "grid", placeItems: "center" }}>
                <Ikon name="eco" size={20} fill />
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "#ffffff" }}>Switera</span>
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "22rem" }}>
              Platform manajemen distribusi Tandan Buah Segar (TBS) kelapa sawit, dari permintaan sampai pengiriman.
            </p>
          </div>
          {[
            { judul: "Produk", link: [["Fitur", "fitur"], ["Peta Distribusi", "peta"], ["Demo", "demo"]] },
            { judul: "Panduan", link: [["Cara Kerja", "cara-kerja"], ["FAQ", "faq"]] },
            { judul: "Akses", link: null },
          ].map((kolom) => (
            <div key={kolom.judul}>
              <h4 style={{ margin: "0 0 14px", fontFamily: "var(--font-heading)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-lime)" }}>
                {kolom.judul}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                {kolom.link
                  ? kolom.link.map(([label, id]) => (
                      <button key={id} type="button" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.7)" }} onClick={() => scrollToId(id)}>
                        {label}
                      </button>
                    ))
                  : (
                    <>
                      <button type="button" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.7)" }} onClick={goLogin}>Masuk</button>
                      <button type="button" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.7)" }} onClick={goRegister}>Daftar</button>
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", padding: "20px var(--space-8)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.55)" }}>
            © Switera 2026. Platform Manajemen Distribusi TBS Kelapa Sawit.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
