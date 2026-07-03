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
  const [ingatSaya, setIngatSaya] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const linkRipple = useRipple();

  const getInputStyle = (field) => ({
    ...inputBaseStyle,
    borderColor: errors[field]
      ? "var(--color-danger)"
      : focusedField === field
        ? "var(--color-primary)"
        : "var(--color-border-mid)",
    boxShadow: errors[field]
      ? "none"
      : focusedField === field
        ? "0 0 0 3px var(--color-primary-glow)"
        : "none",
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
      await store.login(username, password, role, ingatSaya);
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
            color: "rgba(255,255,255,0.25)",
          }}
        >
          © Switera 2026
        </span>

        <form
          onSubmit={handleSubmit}
          style={{
            position: "relative",
            width: "min(440px, 90vw)",
            boxSizing: "border-box",
            backgroundColor: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.6)",
            borderTop: "6px solid var(--color-primary)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-xl)",
            padding: "var(--space-10)",
            animation: "scaleIn 200ms var(--ease-out) both",
          }}
        >
          {onClose ? <TombolClose onClick={onClose} /> : null}

          <div style={{ marginBottom: "var(--space-8)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-5)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-primary-container)",
                  color: "var(--color-on-primary-container)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "22px", lineHeight: 1, fontVariationSettings: "'FILL' 1" }}
                >
                  eco
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: "var(--font-weight-bold)",
                  fontSize: "var(--text-lg)",
                  color: "var(--color-primary)",
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
              Masuk
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Masuk ke akun Anda
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
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--space-2)",
              marginBottom: "var(--space-6)",
              fontSize: "var(--text-xs)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={ingatSaya}
                onChange={(event) => setIngatSaya(event.target.checked)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              Ingat saya
            </label>
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
