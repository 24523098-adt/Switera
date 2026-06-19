import { useEffect, useState } from "react";
import store from "../store";
import useRipple from "../hooks/useRipple";

const roleOptions = ["Admin", "Manajer Distribusi", "Tim Logistik"];

const fieldLabelStyle = {
  fontSize: "var(--text-xs)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-secondary)",
  letterSpacing: "var(--tracking-wide)",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const inputBaseStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--color-border-mid)",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--color-surface-2)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  padding: "10px 40px 10px 14px",
  outline: "none",
  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
};

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

function IkonDaun({ size = 24, color = "var(--color-primary)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M39 8C25.5 8.4 13 16.7 13 29.2C13 35.2 17.8 40 23.8 40C35.7 40 41.2 25.4 39 8Z"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M11 40C16.8 27.3 25.3 19.5 36 14" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function IkonOrang() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C5.8 16.8 8.5 15 12 15C15.5 15 18.2 16.8 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IkonMata() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C4.5 7.8 7.8 5.7 12 5.7C16.2 5.7 19.5 7.8 22 12C19.5 16.2 16.2 18.3 12 18.3C7.8 18.3 4.5 16.2 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IkonAlertCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1" fill="currentColor" />
    </svg>
  );
}

function TombolClose({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Tutup"
      style={{
        position: "absolute",
        top: "var(--space-4)",
        right: "var(--space-4)",
        width: "32px",
        height: "32px",
        display: "grid",
        placeItems: "center",
        backgroundColor: hovered ? "var(--color-surface-hover)" : "var(--color-surface-3)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        color: hovered ? "var(--color-text-primary)" : "var(--color-text-muted)",
        cursor: "pointer",
        fontSize: "1.1rem",
        lineHeight: 1,
        transition: "var(--transition-fast)",
      }}
    >
      ×
    </button>
  );
}

function RolePills({ selectedRole, onSelectRole }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "4px",
        marginBottom: "var(--space-6)",
      }}
    >
      {roleOptions.map((role) => {
        const active = role === selectedRole;

        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelectRole(role)}
            onMouseDown={(event) => onMouseDown(event, role)}
            style={{
              position: "relative",
              overflow: "hidden",
              flex: 1,
              textAlign: "center",
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-xs)",
              fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
              color: active ? "#fff" : "var(--color-text-muted)",
              backgroundColor: active ? "var(--color-primary)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              cursor: "pointer",
              userSelect: "none",
              fontFamily: "var(--font-body)",
              transition: "all var(--transition-fast)",
            }}
          >
            {role}
            <RippleSpans
              ripples={ripples.filter((ripple) => ripple.groupId === role)}
              removeRipple={removeRipple}
            />
          </button>
        );
      })}
    </div>
  );
}

function FieldIcon({ children, onClick, clickable }) {
  return (
    <span
      onClick={onClick}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--color-text-muted)",
        width: "16px",
        height: "16px",
        display: "inline-flex",
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {children}
    </span>
  );
}

function ErrorText({ children }) {
  if (!children) {
    return null;
  }

  return (
    <p
      role="alert"
      style={{
        margin: "4px 0 0",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        color: "var(--color-danger)",
        fontSize: "var(--text-xs)",
      }}
    >
      <IkonAlertCircle />
      {children}
    </p>
  );
}

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
        `}
      </style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: "var(--z-modal)",
          backgroundImage:
            "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(8,30,18,0.85) 100%), url('/images/sawit-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            position: "relative",
            width: "min(420px, 90vw)",
            boxSizing: "border-box",
            backgroundColor: "rgba(15,15,15,0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.05)",
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
              <IkonDaun />
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
                  <IkonMata />
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
                  <IkonMata />
                </FieldIcon>
              </span>
              <ErrorText>{errors.konfirmasiPassword}</ErrorText>
            </label>
          </div>

          <button
            type="submit"
            disabled={Boolean(successMessage)}
            onMouseDown={submitRipple.onMouseDown}
            style={{
              position: "relative",
              overflow: "hidden",
              width: "100%",
              marginTop: "var(--space-6)",
              padding: "11px",
              backgroundColor: "var(--color-primary)",
              border: "1px solid var(--color-primary-hover)",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: successMessage ? "default" : "pointer",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(event) => {
              if (successMessage) return;
              event.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
              event.currentTarget.style.boxShadow = "var(--shadow-glow-primary)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "var(--color-primary)";
              event.currentTarget.style.boxShadow = "none";
            }}
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
              onClick={goToLogin}
              onMouseDown={linkRipple.onMouseDown}
              style={{
                position: "relative",
                overflow: "hidden",
                border: "none",
                background: "transparent",
                color: "var(--color-primary)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-semibold)",
                padding: 0,
                textDecoration: "none",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.textDecoration = "none";
              }}
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
