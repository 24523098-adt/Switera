import { useEffect, useRef, useState } from "react";
import useRipple from "../hooks/useRipple";
import Login from "./Login";
import Register from "./Register";

const FITUR_LIST = [
  {
    type: "ranking",
    judul: "Ranking Kota Otomatis",
    deskripsi:
      "Sistem menghitung dan mengurutkan kota berdasarkan total permintaan secara otomatis.",
  },
  {
    type: "rekomendasi",
    judul: "Rekomendasi Distribusi",
    deskripsi:
      "Saran kota tujuan distribusi berdasarkan data, bukan tebakan manual.",
  },
  {
    type: "dashboard",
    judul: "Dashboard Terpusat",
    deskripsi:
      "Semua data permintaan dan distribusi terkumpul dalam satu tempat.",
  },
  {
    type: "multirole",
    judul: "Manajemen Multi-Role",
    deskripsi:
      "Akses berbeda untuk Admin, Manajer Distribusi, dan Tim Logistik.",
  },
  {
    type: "laporan",
    judul: "Laporan & Riwayat",
    deskripsi: "Pantau histori keputusan distribusi kapan saja diperlukan.",
  },
  {
    type: "realtime",
    judul: "Update Real-Time",
    deskripsi:
      "Perubahan status distribusi langsung terlihat oleh seluruh tim.",
  },
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
  { nilai: "8", label: "Kota Terpantau" },
  { nilai: "20+", label: "Data Permintaan" },
  { nilai: "<1 Detik", label: "Analisis Ranking" },
  { nilai: "3 Role", label: "Akses Terstruktur" },
];

function IkonDaun({ size = 22, color = "var(--color-primary)" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M39 8C25.5 8.4 13 16.7 13 29.2C13 35.2 17.8 40 23.8 40C35.7 40 41.2 25.4 39 8Z"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M11 40C16.8 27.3 25.3 19.5 36 14"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function FiturIcon({ type }) {
  const stroke = "var(--color-primary)";
  const common = {
    width: 20,
    height: 20,
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

const TONE_STYLES = {
  primer: {
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1px solid var(--color-primary-hover)",
  },
  sekunder: {
    backgroundColor: "transparent",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border-mid)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
};

const SIZE_STYLES = {
  sm: { padding: "7px 14px", fontSize: "var(--text-xs)" },
  md: { padding: "11px 24px", fontSize: "var(--text-sm)" },
};

function LandingButton({ label, onClick, tone = "primer", size = "md", iconRight, style }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontWeight: "var(--font-weight-semibold)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        whiteSpace: "nowrap",
        transition: "all var(--transition-base)",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        backgroundColor:
          hovered && tone === "primer"
            ? "var(--color-primary-hover)"
            : hovered && tone === "sekunder"
              ? "var(--color-surface-3)"
              : hovered && tone === "ghost"
                ? "var(--color-surface-hover)"
                : TONE_STYLES[tone].backgroundColor,
        color: hovered && tone === "ghost" ? "var(--color-text-primary)" : TONE_STYLES[tone].color,
        border: TONE_STYLES[tone].border,
        boxShadow: hovered && tone === "primer" ? "var(--shadow-glow-primary)" : "none",
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {label}
      {iconRight}
      <RippleSpans ripples={ripples} removeRipple={removeRipple} />
    </button>
  );
}

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

function HeroGlow() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(45,106,79,0.12) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "auto, 32px 32px",
        pointerEvents: "none",
      }}
    />
  );
}

function MockupDashboard() {
  const metrics = [
    { label: "Total Kota", value: "8" },
    { label: "Permintaan", value: "245 ton" },
    { label: "Status Aktif", value: "12" },
  ];
  const rowWidths = ["70%", "55%", "82%", "40%"];

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl), 0 0 80px rgba(45,106,79,0.08)",
        padding: "var(--space-4)",
        overflow: "hidden",
        width: "100%",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--space-4)" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "var(--color-danger)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "var(--color-warning)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "var(--color-success)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>{metric.label}</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--text-md)",
                color: "var(--color-text-primary)",
                marginTop: "2px",
              }}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {rowWidths.map((width, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderBottom: index < rowWidths.length - 1 ? "1px solid var(--color-border)" : "none",
              backgroundColor: index % 2 === 0 ? "var(--color-surface-2)" : "var(--color-surface-3)",
            }}
          >
            <div style={{ width: "20px", height: "8px", borderRadius: "var(--radius-xs)", backgroundColor: "var(--color-border-mid)" }} />
            <div style={{ width, height: "8px", borderRadius: "var(--radius-xs)", backgroundColor: "var(--color-border-mid)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Landing({ onNavigate }) {
  const [hoveredFitur, setHoveredFitur] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
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
    fontSize: "var(--text-2xl)",
    fontWeight: "var(--font-weight-semibold)",
    letterSpacing: "var(--tracking-tight)",
    textAlign: "center",
    color: "var(--color-text-primary)",
  };

  const sectionSubtextStyle = {
    margin: "0.75rem 0 0",
    color: "var(--color-text-secondary)",
    lineHeight: "var(--leading-loose)",
    textAlign: "center",
  };

  return (
    <div
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

          .landing-fitur-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-6);
          }

          @media (max-width: 900px) {
            .landing-fitur-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 580px) {
            .landing-fitur-grid {
              grid-template-columns: 1fr;
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
          height: "64px",
          padding: "0 var(--space-10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: scrolled ? "rgba(8,8,8,0.9)" : "rgba(8,8,8,0)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
          transition: "background-color 300ms ease, border-color 300ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <IkonDaun size={22} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: "var(--font-weight-bold)",
              fontSize: "var(--text-lg)",
              color: "var(--color-text-primary)",
            }}
          >
            Switera
          </span>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
          <LandingButton label="Masuk" tone="sekunder" size="sm" onClick={openLogin} />
          <LandingButton label="Daftar" tone="primer" size="sm" onClick={openRegister} />
        </div>
      </header>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          paddingTop: "64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--space-16) var(--space-6)",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <HeroGlow />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "var(--color-primary-subtle)",
              border: "1px solid rgba(45,106,79,.25)",
              color: "var(--color-primary)",
              borderRadius: "var(--radius-full)",
              padding: "4px 14px",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
              letterSpacing: "var(--tracking-wide)",
              marginBottom: "var(--space-5)",
              animation: "landingFadeIn 600ms 100ms both",
            }}
          >
            Platform Distribusi TBS Kelapa Sawit
          </span>

          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: "var(--font-weight-bold)",
              letterSpacing: "-0.03em",
              lineHeight: "var(--leading-tight)",
              color: "var(--color-text-primary)",
              maxWidth: "720px",
              "--from-y": "20px",
              animation: "landingFadeInUp 700ms 200ms both",
            }}
          >
            Distribusi <span style={{ color: "var(--color-primary)" }}>TBS</span> Kelapa Sawit
            yang Lebih <span style={{ color: "var(--color-primary)" }}>Cepat dan Akurat</span>
          </h1>

          <p
            style={{
              fontSize: "var(--text-md)",
              color: "var(--color-text-secondary)",
              maxWidth: "520px",
              marginTop: "var(--space-4)",
              marginBottom: 0,
              lineHeight: "var(--leading-loose)",
              "--from-y": "16px",
              animation: "landingFadeInUp 700ms 350ms both",
            }}
          >
            Switera membantu manajer distribusi menentukan kota tujuan
            berdasarkan data permintaan secara real-time, tanpa tebakan
            manual.
          </p>

          <div
            style={{
              marginTop: "var(--space-8)",
              display: "flex",
              gap: "var(--space-3)",
              justifyContent: "center",
              flexWrap: "wrap",
              animation: "landingFadeIn 600ms 500ms both",
            }}
          >
            <LandingButton label="Mulai Sekarang" tone="primer" size="md" onClick={openRegister} />
            <LandingButton
              label="Masuk ke Akun"
              tone="ghost"
              size="md"
              iconRight={<IkonArrowRight />}
              onClick={openLogin}
            />
          </div>

          <div
            style={{
              marginTop: "var(--space-12)",
              maxWidth: "860px",
              width: "100%",
              "--from-y": "32px",
              animation: "landingFadeInUp 800ms 600ms both",
            }}
          >
            <MockupDashboard />
          </div>
        </div>
      </section>

      <section
        id="fitur"
        style={{
          padding: "var(--space-16) var(--space-10)",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ maxWidth: "640px", margin: "0 auto var(--space-10)" }}>
              <p style={sectionLabelStyle}>Fitur Unggulan</p>
              <h2 style={sectionHeadingStyle}>Fitur Utama</h2>
              <p style={sectionSubtextStyle}>
                Semua yang dibutuhkan untuk mengelola distribusi TBS dari satu
                platform.
              </p>
            </div>
          </Reveal>

          <div className="landing-fitur-grid">
            {FITUR_LIST.map((fitur, index) => (
              <Reveal key={fitur.judul} delay={index * 80}>
                <div
                  onMouseEnter={() => setHoveredFitur(fitur.judul)}
                  onMouseLeave={() => setHoveredFitur("")}
                  style={{
                    height: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--color-surface-2)",
                    border: `1px solid ${
                      hoveredFitur === fitur.judul ? "var(--color-border-strong)" : "var(--color-border)"
                    }`,
                    borderRadius: "var(--radius-lg)",
                    boxShadow: hoveredFitur === fitur.judul ? "var(--shadow-md)" : "none",
                    transform: hoveredFitur === fitur.judul ? "translateY(-2px)" : "translateY(0)",
                    padding: "var(--space-6)",
                    transition:
                      "border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-primary-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    <FiturIcon type={fitur.type} />
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      marginBottom: "var(--space-2)",
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-md)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {fitur.judul}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-secondary)",
                      lineHeight: "var(--leading-loose)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {fitur.deskripsi}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="cara-kerja"
        style={{
          padding: "var(--space-16) var(--space-10)",
          backgroundColor: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ maxWidth: "640px", margin: "0 auto var(--space-10)" }}>
              <h2 style={sectionHeadingStyle}>Cara Kerja</h2>
              <p style={sectionSubtextStyle}>
                Tiga langkah sederhana dari data hingga distribusi berjalan.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {LANGKAH_LIST.map((langkah, index) => (
              <Reveal
                key={langkah.nomor}
                delay={index * 80}
                style={{ display: "flex", alignItems: "flex-start", flex: 1 }}
              >
                <div style={{ flex: 1, maxWidth: "280px", textAlign: "center", margin: "0 auto" }}>
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
                      fontFamily: "var(--font-display)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "var(--text-xl)",
                      margin: "0 auto var(--space-4)",
                    }}
                  >
                    {langkah.nomor}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-md)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {langkah.judul}
                  </h3>
                  <p
                    style={{
                      margin: "var(--space-2) 0 0",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-sm)",
                      lineHeight: "var(--leading-loose)",
                    }}
                  >
                    {langkah.deskripsi}
                  </p>
                </div>

                {index < LANGKAH_LIST.length - 1 ? (
                  <div
                    aria-hidden="true"
                    style={{
                      flex: 1,
                      minWidth: "32px",
                      height: 0,
                      marginTop: "24px",
                      borderTop: "1px dashed var(--color-border-mid)",
                      alignSelf: "flex-start",
                    }}
                  />
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "var(--space-10) var(--space-10)",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Reveal>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-16)", flexWrap: "wrap" }}>
            {STATISTIK_LIST.map((stat, index) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-16)" }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "var(--text-3xl)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {stat.nilai}
                  </div>
                  <div
                    style={{
                      marginTop: "var(--space-1)",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-sm)",
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

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "var(--space-16) var(--space-10)",
          backgroundColor: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <HeroGlow />
        <Reveal style={{ position: "relative" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <h2 style={sectionHeadingStyle}>Siap Mengoptimalkan Distribusi TBS Anda?</h2>
            <div style={{ marginTop: "var(--space-8)", display: "flex", justifyContent: "center" }}>
              <LandingButton
                label="Daftar Sekarang"
                tone="primer"
                size="md"
                style={{ padding: "13px 32px", fontSize: "var(--text-base)" }}
                onClick={openRegister}
              />
            </div>
          </div>
        </Reveal>
      </section>

      <footer
        style={{
          padding: "var(--space-6) var(--space-10)",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IkonDaun size={16} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>
            Switera
          </span>
        </div>
        <p style={{ margin: 0 }}>© 2026 Switera. Dibuat untuk tugas Pengembangan Sistem Informasi.</p>
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
