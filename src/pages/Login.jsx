import { useState } from "react";
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

function Login({ onNavigate, onClose, onSwitchToRegister }) {
  const [role, setRole] = useState("Admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ingatSaya, setIngatSaya] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [error, setError] = useState("");
  const linkRipple = useRipple();
  const submitRipple = useRipple();

  const getInputStyle = (field) => ({
    ...inputBaseStyle,
    borderColor: focusedField === field ? "var(--color-primary)" : "var(--color-border-mid)",
    boxShadow: focusedField === field ? "0 0 0 3px var(--color-primary-glow)" : "none",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim() || !role) {
      setError("Harap isi semua field.");
      return;
    }

    const akun = store.cariAkun(username, password, role);

    if (!akun) {
      setError("Username, password, atau role tidak sesuai.");
      return;
    }

    const { password: _password, ...userAktif } = akun;
    store.setUserAktif(userAktif);
    onNavigate?.("/dashboard");
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

          <RolePills selectedRole={role} onSelectRole={setRole} />

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
                    setError("");
                  }}
                  style={getInputStyle("username")}
                  autoComplete="username"
                />
                <FieldIcon>
                  <IkonOrang />
                </FieldIcon>
              </span>
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
                    setError("");
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
            </label>

            <ErrorText>{error}</ErrorText>
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
              onClick={(event) => event.preventDefault()}
            >
              Lupa Password?
            </a>
          </div>

          <button type="submit" className="auth-submit-btn" onMouseDown={submitRipple.onMouseDown}>
            Masuk
            <RippleSpans ripples={submitRipple.ripples} removeRipple={submitRipple.removeRipple} />
          </button>

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
