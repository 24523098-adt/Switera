import { useEffect, useRef, useState } from "react";
import Login from "./Login";
import Register from "./Register";

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

const FITUR = [
  {
    ikon: "trending_up",
    judul: "Ranking Kota Otomatis",
    deskripsi:
      "Sistem menghitung dan mengurutkan kota tujuan berdasarkan total permintaan secara otomatis — tanpa hitung manual.",
  },
  {
    ikon: "recommend",
    judul: "Rekomendasi Distribusi",
    deskripsi:
      "Saran kota tujuan dan alokasi TBS berbasis data dan ketersediaan stok, bukan tebakan.",
  },
  {
    ikon: "dashboard",
    judul: "Dashboard Terpusat",
    deskripsi:
      "Semua data permintaan, keputusan, dan status pengiriman dalam satu tampilan yang selalu ter-update.",
  },
  {
    ikon: "groups",
    judul: "Multi-Peran",
    deskripsi:
      "Admin, Manajer Distribusi, dan Tim Logistik dengan akses dan alur kerja yang sesuai perannya.",
  },
];

const CARA_KERJA = [
  {
    nomor: "1",
    ikon: "edit_note",
    judul: "Input Permintaan",
    deskripsi: "Catat permintaan TBS tiap kota beserta jumlah dan tanggalnya.",
  },
  {
    nomor: "2",
    ikon: "insights",
    judul: "Hitung & Rekomendasi",
    deskripsi: "Sistem menyusun ranking kota dan merekomendasikan alokasi distribusi.",
  },
  {
    nomor: "3",
    ikon: "local_shipping",
    judul: "Putuskan & Lacak",
    deskripsi: "Setujui keputusan distribusi lalu pantau status pengiriman sampai selesai.",
  },
];

function Landing({ onNavigate }) {
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

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    transition: "transform var(--transition-slow), background-color var(--transition-slow), box-shadow var(--transition-slow)",
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg)", color: "var(--color-on-background)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ===== Navbar ===== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-toast)",
          height: "72px",
          backgroundColor: scrolled ? "rgba(248,249,255,0.85)" : "rgba(248,249,255,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          transition: "background-color var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)",
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            height: "100%",
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
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-primary)",
              }}
            >
              Switera
            </span>
          </div>

          <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("fitur")}>Fitur</button>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("cara-kerja")}>Cara Kerja</button>
            <button type="button" style={navLinkStyle} onClick={() => scrollToId("cta")}>Tentang</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              type="button"
              onClick={openLogin}
              style={{
                ...navLinkStyle,
                color: "var(--color-primary)",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
              }}
            >
              Masuk
            </button>
            <button type="button" onClick={openRegister} style={{ ...btnPrimer, padding: "10px 20px" }}>
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
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
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "80px", left: "40px", width: "288px", height: "288px", background: "rgba(0,134,86,0.10)", borderRadius: "50%", filter: "blur(64px)" }} />
        <div style={{ position: "absolute", bottom: "40px", right: "40px", width: "384px", height: "384px", background: "rgba(64,194,253,0.10)", borderRadius: "50%", filter: "blur(64px)" }} />

        <div
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
          className="landing-hero-grid"
        >
          {/* Left */}
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
              <span className="animate-pulse-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>
                Platform Distribusi TBS Kelapa Sawit
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
                fontWeight: "var(--font-weight-bold)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--color-on-background)",
                margin: 0,
              }}
            >
              Distribusi TBS Lebih Cepat, Tepat, dan{" "}
              <span
                style={{
                  background: "linear-gradient(to right, #006a43, #008656)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Menguntungkan
              </span>
            </h1>

            <p style={{ fontSize: "var(--text-lg)", color: "var(--color-on-surface-variant)", maxWidth: "36rem", lineHeight: 1.6, margin: 0 }}>
              Sistem informasi manajemen distribusi kelapa sawit berbasis data untuk tim distribusi yang modern dan efisien.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginTop: "8px" }}>
              <button type="button" onClick={openLogin} className="landing-cta-primer" style={{ ...btnPrimer, padding: "16px 28px", fontSize: "var(--text-base)", boxShadow: "var(--shadow-md)" }}>
                Mulai Sekarang
                <Ikon name="arrow_forward" size={20} />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("cara-kerja")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 28px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-outline-variant)",
                  backgroundColor: "transparent",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-semibold)",
                  fontSize: "var(--text-base)",
                  cursor: "pointer",
                  transition: "background-color var(--transition-fast), border-color var(--transition-fast)",
                }}
              >
                <Ikon name="play_circle" size={20} />
                Lihat Demo
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
                    color: "var(--color-on-surface-variant)",
                    display: "grid",
                    placeItems: "center",
                    marginLeft: "-12px",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-bold)",
                  }}
                >
                  50+
                </span>
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)" }}>
                Dipercaya <strong style={{ color: "var(--color-on-background)" }}>50+</strong> tim distribusi sawit
              </div>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="landing-hero-mockup" style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,106,67,0.20)", filter: "blur(80px)", borderRadius: "50%", transform: "scale(0.9) translateY(40px)" }} />
            <div
              style={{
                position: "relative",
                backgroundColor: "var(--color-surface-container-lowest)",
                borderRadius: "var(--radius-2xl)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--color-outline-variant)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-container)", display: "grid", placeItems: "center", color: "var(--color-primary)" }}>
                    <Ikon name="bar_chart" size={18} />
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-on-surface-variant)" }}>Total Distribusi</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-on-background)" }}>Hari ini</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>1.240 Ton</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                    <Ikon name="trending_up" size={14} /> +12%
                  </div>
                </div>
              </div>

              <div style={{ height: "140px", backgroundColor: "var(--color-surface-container-low)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "16px", gap: "8px" }}>
                {[30, 50, 80, 40, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: "16%",
                      height: `${h}%`,
                      borderRadius: "4px 4px 0 0",
                      backgroundColor: i === 2 ? "var(--color-primary)" : "var(--color-surface-container-high)",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[{ k: "Dumai", v: "450 Ton" }, { k: "Pekanbaru", v: "380 Ton" }].map((row) => (
                  <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-container-low)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Ikon name="location_on" size={16} style={{ color: "var(--color-secondary)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-on-background)" }}>{row.k}</span>
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Fitur ===== */}
      <section id="fitur" style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px var(--space-8)" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 3vw, 2rem)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-background)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
              Semua yang dibutuhkan untuk mengelola distribusi
            </h2>
            <p style={{ fontSize: "var(--text-md)", color: "var(--color-on-surface-variant)", margin: 0 }}>
              Dari input permintaan hingga pelacakan pengiriman, dalam satu platform.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-6)" }} className="app-grid-4">
          {FITUR.map((item, i) => (
            <Reveal key={item.judul} delay={i * 80}>
              <div
                className="app-card app-card-hoverable"
                style={{
                  backgroundColor: "var(--color-surface-container-lowest)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                  padding: "var(--space-6)",
                  height: "100%",
                }}
              >
                <span style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-surface-container)", color: "var(--color-primary)", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                  <Ikon name={item.ikon} size={24} fill />
                </span>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-background)", margin: "0 0 8px" }}>
                  {item.judul}
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6, margin: 0 }}>
                  {item.deskripsi}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Cara Kerja ===== */}
      <section id="cara-kerja" style={{ backgroundColor: "var(--color-surface-container-low)", padding: "80px 0" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-8)" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 48px" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 3vw, 2rem)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-background)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
                Cara Kerja
              </h2>
              <p style={{ fontSize: "var(--text-md)", color: "var(--color-on-surface-variant)", margin: 0 }}>
                Tiga langkah sederhana dari data ke keputusan distribusi.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-6)" }} className="app-grid-3">
            {CARA_KERJA.map((step, i) => (
              <Reveal key={step.nomor} delay={i * 100}>
                <div style={{ backgroundColor: "var(--color-surface-container-lowest)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "var(--space-6)", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: "var(--font-weight-bold)" }}>
                      {step.nomor}
                    </span>
                    <Ikon name={step.ikon} size={24} style={{ color: "var(--color-primary)" }} fill />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-on-background)", margin: "0 0 8px" }}>
                    {step.judul}
                  </h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-on-surface-variant)", lineHeight: 1.6, margin: 0 }}>
                    {step.deskripsi}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" style={{ padding: "80px var(--space-8)" }}>
        <Reveal>
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--radius-2xl)",
              padding: "clamp(40px, 6vw, 72px)",
              textAlign: "center",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: "var(--font-weight-bold)", color: "var(--color-on-primary)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
              Siap mengoptimalkan distribusi TBS Anda?
            </h2>
            <p style={{ fontSize: "var(--text-md)", color: "rgba(255,255,255,0.85)", margin: "0 0 28px" }}>
              Mulai kelola distribusi kelapa sawit dengan lebih cepat, tepat, dan terukur.
            </p>
            <button
              type="button"
              onClick={openRegister}
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

      {/* ===== Footer ===== */}
      <footer style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "40px var(--space-8)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "36px", height: "36px", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)", display: "grid", placeItems: "center" }}>
              <Ikon name="eco" size={20} fill />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>Switera</span>
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-on-surface-variant)" }}>
            © Switera 2026 — Platform Manajemen Distribusi TBS Kelapa Sawit.
          </p>
        </div>
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
