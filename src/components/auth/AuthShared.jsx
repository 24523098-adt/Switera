import useRipple, { RippleSpans } from "../../hooks/useRipple";

export const roleOptions = ["Admin", "Manajer Distribusi", "Tim Logistik"];

export const fieldLabelStyle = {
  fontSize: "var(--text-sm)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-on-surface)",
  marginBottom: "6px",
};

export const inputBaseStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-on-surface)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  padding: "12px 44px 12px 16px",
  outline: "none",
  WebkitAppearance: "none",
  transition: "border-color var(--transition-input), box-shadow var(--transition-input)",
};

export function IkonOrang() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C5.8 16.8 8.5 15 12 15C15.5 15 18.2 16.8 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IkonMata({ crossed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C4.5 7.8 7.8 5.7 12 5.7C16.2 5.7 19.5 7.8 22 12C19.5 16.2 16.2 18.3 12 18.3C7.8 18.3 4.5 16.2 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      {crossed ? (
        <path d="M4 4L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

export function IkonAlertCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1" fill="currentColor" />
    </svg>
  );
}

export function TombolClose({ onClick }) {
  return (
    <button type="button" className="auth-close-btn" onClick={onClick} aria-label="Tutup">
      ×
    </button>
  );
}

// Pill tabs peran dengan sliding indicator — indikator hijau bergeser halus
// mengikuti peran terpilih (design system Catalyst).
export function RolePills({ selectedRole, onSelectRole }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();
  const activeIndex = Math.max(0, roleOptions.indexOf(selectedRole));

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: "0",
        backgroundColor: "var(--color-surface-container-low)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-full)",
        padding: "4px",
        marginBottom: "var(--space-6)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "4px",
          bottom: "4px",
          left: "4px",
          width: `calc((100% - 8px) / ${roleOptions.length})`,
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--color-primary)",
          boxShadow: "var(--shadow-sm)",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {roleOptions.map((role) => {
        const active = role === selectedRole;

        return (
          <button
            key={role}
            type="button"
            className={`role-pill${active ? " is-active" : ""}`}
            onClick={() => onSelectRole(role)}
            onMouseDown={(event) => onMouseDown(event, role)}
            style={{ position: "relative", zIndex: 1 }}
          >
            {role}
            <RippleSpans ripples={ripples} removeRipple={removeRipple} groupId={role} />
          </button>
        );
      })}
    </div>
  );
}

export function FieldIcon({ children, onClick, clickable }) {
  return (
    <span
      onClick={onClick}
      style={{
        position: "absolute",
        right: "14px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--color-outline)",
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

export function ErrorText({ children }) {
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
        color: "var(--color-error)",
        fontSize: "var(--text-xs)",
        animation: "fadeInDown 150ms var(--ease-out) both",
      }}
    >
      <IkonAlertCircle />
      {children}
    </p>
  );
}
