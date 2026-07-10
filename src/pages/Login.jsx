import { useState } from "react";
import store from "../store";
import { showToast } from "../components/Toast";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import Tombol from "../components/Tombol";
import {
  ErrorText,
  FieldIcon,
  IkonMata,
  IkonOrang,
  RolePills,
  TombolClose,
  fieldLabelStyle,
  inputBaseStyle,
} from "../components/auth/AuthShared";

function Login({ onNavigate, onClose, onSwitchToRegister }) {
  const [role, setRole] = useState("Admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const linkRipple = useRipple();

  // Fokus ala neo brutalist: latar berubah pastel, border tetap hitam.
  // Error ditandai border merah tebal.
  const getInputStyle = (field) => ({
    ...inputBaseStyle,
    borderColor: errors[field] ? "var(--color-error)" : "#000000",
    backgroundColor: focusedField === field ? "var(--color-pastel)" : "#ffffff",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Username wajib diisi.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password wajib diisi.";
    }

    if (!role) {
      nextErrors.role = "Pilih role terlebih dahulu.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await store.login(username, password, role);
      onNavigate?.("/dashboard");
    } catch {
      // The server returns one generic 401 for unknown-user/wrong-password/
      // wrong-role (T-07-ENUM anti-enumeration design) — surfaced on the
      // password field. Client-side credential inspection is gone by
      // design; store.login already fired the error Toast.
      setErrors({ password: "Username atau password salah." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDaftarClick = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      onNavigate?.("/register");
    }
  };

  // Akun demo cepat — kredensial sesuai seed database (server/prisma/seed.js).
  const demoAccounts = [
    { role: "Admin", username: "admin", password: "admin123", label: "Admin" },
    { role: "Manajer Distribusi", username: "manajer", password: "manajer123", label: "Manajer" },
    { role: "Tim Logistik", username: "logistik", password: "logistik123", label: "Logistik" },
  ];

  const handleDemoLogin = async (akun) => {
    if (isSubmitting) {
      return;
    }
    // Isi form agar terlihat kredensial yang dipakai, lalu langsung login.
    setRole(akun.role);
    setUsername(akun.username);
    setPassword(akun.password);
    setErrors({});
    setIsSubmitting(true);
    try {
      await store.login(akun.username, akun.password, akun.role);
      onNavigate?.("/dashboard");
    } catch {
      setErrors({ password: "Login demo gagal. Pastikan server & database aktif." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .auth-input::placeholder {
            color: var(--color-text-disabled);
          }

          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear,
          input[type="password"]::-webkit-credentials-auto-fill-button {
            display: none;
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: "var(--z-modal)",
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%), linear-gradient(90deg, rgba(8,20,14,0.6) 0%, transparent 60%), url('/images/sawit-bg.jpg')",
          backgroundSize: "cover, cover, cover",
          backgroundPosition: "center, center, center",
          backgroundColor: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-6)",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <span
          style={{
            position: "absolute",
            bottom: "var(--space-6)",
            left: "var(--space-8)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-bold)",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          © Switera 2026
        </span>

        {/* Stiker dekoratif ala masuk_switera_neo_brutalist */}
        <span
          aria-hidden="true"
          className="landing-hero-mockup"
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            backgroundColor: "var(--color-info-bg)",
            border: "3px solid #000000",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-md)",
            padding: "8px 24px",
            transform: "rotate(-12deg)",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontSize: "var(--text-md)",
            color: "#000000",
          }}
        >
          TBS v2.0
        </span>
        <span
          aria-hidden="true"
          className="landing-hero-mockup"
          style={{
            position: "absolute",
            bottom: "22%",
            right: "10%",
            backgroundColor: "var(--color-secondary-container)",
            border: "3px solid #000000",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-md)",
            padding: "8px 24px",
            transform: "rotate(8deg)",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontSize: "var(--text-md)",
            color: "#000000",
          }}
        >
          Aman dan Terpusat
        </span>

        <form
          onSubmit={handleSubmit}
          style={{
            position: "relative",
            width: "min(460px, 90vw)",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            border: "3px solid #000000",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "6px 6px 0px 0px #000000",
            padding: "var(--space-10)",
            animation: "scaleIn 200ms var(--ease-out) both",
          }}
        >
          {onClose ? <TombolClose onClick={onClose} /> : null}

          {/* Header terpusat ala Stitch masuk_switera: badge ikon bulat + judul. */}
          <div style={{ marginBottom: "var(--space-8)", textAlign: "center" }}>
            <span
              aria-hidden="true"
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto var(--space-3)",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-lime)",
                border: "2px solid #000000",
                boxShadow: "var(--shadow-sm)",
                color: "#000000",
                display: "grid",
                placeItems: "center",
                transform: "rotate(-6deg)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "32px", lineHeight: 1, fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-3xl)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#000000",
              }}
            >
              Switera
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              Portal Manajemen Distribusi
            </p>
          </div>

          <RolePills
            selectedRole={role}
            onSelectRole={(nextRole) => {
              setRole(nextRole);
              setErrors((previous) => ({ ...previous, role: undefined }));
            }}
          />
          <ErrorText>{errors.role}</ErrorText>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", ...fieldLabelStyle }}>Username</span>
              <span style={{ position: "relative", display: "block" }}>
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  placeholder="Username"
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setErrors((previous) => ({ ...previous, username: undefined }));
                  }}
                  style={getInputStyle("username")}
                  autoComplete="username"
                />
                <FieldIcon>
                  <IkonOrang />
                </FieldIcon>
              </span>
              <ErrorText>{errors.username}</ErrorText>
            </label>

            <label style={{ display: "block" }}>
              <span style={{ display: "block", ...fieldLabelStyle }}>Password</span>
              <span style={{ position: "relative", display: "block" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Password"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((previous) => ({ ...previous, password: undefined }));
                  }}
                  style={getInputStyle("password")}
                  autoComplete="current-password"
                />
                <FieldIcon
                  clickable
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <IkonMata crossed={showPassword} />
                </FieldIcon>
              </span>
              <ErrorText>{errors.password}</ErrorText>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: "var(--space-2)",
              marginBottom: "var(--space-6)",
              fontSize: "var(--text-xs)",
            }}
          >
            <a
              href="#"
              className="auth-forgot-link"
              onClick={(event) => {
                event.preventDefault();
                showToast({
                  type: "info",
                  message: "Silakan hubungi Admin untuk mereset kata sandi Anda.",
                });
              }}
            >
              Lupa Password?
            </a>
          </div>

          <Tombol
            type="submit"
            label={isSubmitting ? "Memproses..." : "Masuk"}
            variant="primer"
            disabled={isSubmitting}
            style={{ width: "100%" }}
          />

          {/* Masuk cepat demo: satu klik login ke tiap peran. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              margin: "var(--space-5) 0 var(--space-3)",
            }}
          >
            <span style={{ flex: 1, height: "2px", backgroundColor: "#000000" }} />
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              Masuk cepat (demo)
            </span>
            <span style={{ flex: 1, height: "2px", backgroundColor: "#000000" }} />
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {demoAccounts.map((akun) => (
              <button
                key={akun.role}
                type="button"
                className="tombol tombol-sekunder"
                onClick={() => handleDemoLogin(akun)}
                disabled={isSubmitting}
                title={`Masuk sebagai ${akun.role} (${akun.username})`}
                style={{ flex: 1, padding: "9px 8px", fontSize: "var(--text-xs)" }}
              >
                {akun.label}
              </button>
            ))}
          </div>

          <p
            style={{
              margin: "var(--space-5) 0 0",
              textAlign: "center",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Belum punya akun?{" "}
            <button
              type="button"
              className="auth-link-btn"
              onClick={handleDaftarClick}
              onMouseDown={linkRipple.onMouseDown}
            >
              Daftar
              <RippleSpans ripples={linkRipple.ripples} removeRipple={linkRipple.removeRipple} />
            </button>
          </p>
        </form>
      </div>
    </>
  );
}

export default Login;
