import { useEffect, useState } from "react";
import store from "../store";
import useRipple, { RippleSpans } from "../hooks/useRipple";
import IkonDaun from "../components/IkonDaun";
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

function Register({ onNavigate, onClose, onSwitchToLogin }) {
  const [role, setRole] = useState("Admin");
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const linkRipple = useRipple();
  const submitRipple = useRipple();

  const goToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      onNavigate?.("/login");
    }
  };

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      goToLogin();
    }, 2000);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  const getInputStyle = (field) => ({
    ...inputBaseStyle,
    borderColor: focusedField === field ? "var(--color-primary)" : "var(--color-border-mid)",
    boxShadow: focusedField === field ? "0 0 0 3px var(--color-primary-glow)" : "none",
  });

  const validate = () => {
    const nextErrors = {};
    const normalizedUsername = username.trim();
    const daftarAkun = store.getDaftarAkun();

    if (!nama.trim() || !normalizedUsername || !password || !konfirmasiPassword || !role) {
      nextErrors.umum = "Semua field wajib diisi.";
    }

    if (normalizedUsername && normalizedUsername.length < 4) {
      nextErrors.username = "Username minimal 4 karakter.";
    }

    if (password && password.length < 6) {
      nextErrors.password = "Password minimal 6 karakter.";
    }

    if (konfirmasiPassword && konfirmasiPassword !== password) {
      nextErrors.konfirmasiPassword = "Konfirmasi password harus sama dengan password.";
    }

    if (
      normalizedUsername &&
      daftarAkun.some((akun) => akun.username === normalizedUsername)
    ) {
      nextErrors.username = "Username sudah digunakan.";
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    store.tambahAkun({
      id: `U${Date.now()}`,
      nama: nama.trim(),
      username: username.trim(),
      password,
      role,
    });

    setSuccessMessage("Akun berhasil dibuat. Silakan masuk.");
  };

  return (
    <>
      <style>
        {`
          @keyframes authCardIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }

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
          padding: "24px",
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
            color: "rgba(255,255,255,0.25)",
          }}
        >
          © Switera 2026
        </span>

        <form
          onSubmit={handleSubmit}
          style={{
            position: "relative",
            width: "min(420px, 90vw)",
            boxSizing: "border-box",
            backgroundColor: "rgba(13,13,13,0.75)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "var(--radius-xl)",
            boxShadow:
              "var(--shadow-xl), 0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            padding: "var(--space-10)",
            animation: "authCardIn 300ms var(--ease-bounce) both",
          }}
        >
          {onClose ? <TombolClose onClick={onClose} /> : null}

          <div style={{ marginBottom: "var(--space-8)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "var(--space-5)",
              }}
            >
              <IkonDaun size={24} />
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
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--font-weight-bold)",
                letterSpacing: "var(--tracking-tight)",
                color: "var(--color-text-primary)",
              }}
            >
              Buat Akun
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Daftar untuk mulai menggunakan Switera
            </p>
          </div>

          <RolePills selectedRole={role} onSelectRole={setRole} />

          <ErrorText>{errors.umum}</ErrorText>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              marginTop: errors.umum ? "var(--space-4)" : 0,
            }}
          >
            <label style={{ display: "block" }}>
              <span style={{ display: "block", ...fieldLabelStyle }}>Nama Lengkap</span>
              <span style={{ position: "relative", display: "block" }}>
                <input
                  className="auth-input"
                  type="text"
                  value={nama}
                  placeholder="Nama lengkap"
                  onFocus={() => setFocusedField("nama")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => {
                    setNama(event.target.value);
                    setErrors({});
                  }}
                  style={getInputStyle("nama")}
                  autoComplete="name"
                />
                <FieldIcon>
                  <IkonOrang />
                </FieldIcon>
              </span>
            </label>

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
                    setErrors({});
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
                    setErrors({});
                  }}
                  style={getInputStyle("password")}
                  autoComplete="new-password"
                />
                <FieldIcon clickable onClick={() => setShowPassword((value) => !value)}>
                  <IkonMata crossed={showPassword} />
                </FieldIcon>
              </span>
              <ErrorText>{errors.password}</ErrorText>
            </label>

            <label style={{ display: "block" }}>
              <span style={{ display: "block", ...fieldLabelStyle }}>Konfirmasi Password</span>
              <span style={{ position: "relative", display: "block" }}>
                <input
                  className="auth-input"
                  type={showKonfirmasiPassword ? "text" : "password"}
                  value={konfirmasiPassword}
                  placeholder="Ulangi password"
                  onFocus={() => setFocusedField("konfirmasiPassword")}
                  onBlur={() => setFocusedField("")}
                  onChange={(event) => {
                    setKonfirmasiPassword(event.target.value);
                    setErrors({});
                  }}
                  style={getInputStyle("konfirmasiPassword")}
                  autoComplete="new-password"
                />
                <FieldIcon
                  clickable
                  onClick={() => setShowKonfirmasiPassword((value) => !value)}
                >
                  <IkonMata crossed={showKonfirmasiPassword} />
                </FieldIcon>
              </span>
              <ErrorText>{errors.konfirmasiPassword}</ErrorText>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={Boolean(successMessage)}
            onMouseDown={submitRipple.onMouseDown}
            style={{ marginTop: "var(--space-6)" }}
          >
            Daftar Sekarang
            <RippleSpans ripples={submitRipple.ripples} removeRipple={submitRipple.removeRipple} />
          </button>

          {successMessage ? (
            <p
              role="status"
              style={{
                margin: "var(--space-4) 0 0",
                textAlign: "center",
                color: "var(--color-success)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {successMessage}
            </p>
          ) : null}

          <p
            style={{
              margin: "var(--space-5) 0 0",
              textAlign: "center",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Sudah punya akun?{" "}
            <button
              type="button"
              className="auth-link-btn"
              onClick={goToLogin}
              onMouseDown={linkRipple.onMouseDown}
            >
              Masuk
              <RippleSpans ripples={linkRipple.ripples} removeRipple={linkRipple.removeRipple} />
            </button>
          </p>
        </form>
      </div>
    </>
  );
}

export default Register;
