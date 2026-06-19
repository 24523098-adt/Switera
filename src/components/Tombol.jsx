import useRipple from "../hooks/useRipple";

const baseStyle = {
  position: "relative",
  overflow: "hidden",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 16px",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--font-weight-semibold)",
  letterSpacing: "var(--tracking-wide)",
  border: "1px solid transparent",
  cursor: "pointer",
  boxShadow: "none",
  transform: "translateY(0)",
  transition: "all var(--transition-base)",
};

const variants = {
  primer: {
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1px solid var(--color-primary-hover)",
    hoverBackgroundColor: "var(--color-primary-hover)",
    hoverBoxShadow: "var(--shadow-glow-primary)",
  },
  sekunder: {
    backgroundColor: "transparent",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border-mid)",
    hoverBackgroundColor: "var(--color-surface-3)",
    hoverBorder: "1px solid var(--color-border-strong)",
  },
  bahaya: {
    backgroundColor: "var(--color-danger-subtle)",
    color: "var(--color-danger)",
    border: "1px solid rgba(229,72,77,.25)",
    hoverBackgroundColor: "rgba(229,72,77,.2)",
    hoverBoxShadow: "0 0 12px rgba(229,72,77,.2)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
    hoverBackgroundColor: "var(--color-surface-hover)",
    hoverColor: "var(--color-text-primary)",
  },
};

function Tombol({ label, variant = "primer", onClick, type = "button", disabled = false }) {
  const selectedVariant = variants[variant] ?? variants.primer;
  const {
    hoverBackgroundColor,
    hoverBorder,
    hoverBoxShadow,
    hoverColor,
    ...buttonVariant
  } = selectedVariant;
  const { ripples, onMouseDown, removeRipple } = useRipple();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...buttonVariant,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = hoverBackgroundColor;
        event.currentTarget.style.border = hoverBorder ?? buttonVariant.border;
        event.currentTarget.style.color = hoverColor ?? buttonVariant.color;
        event.currentTarget.style.boxShadow = hoverBoxShadow ?? "none";
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = buttonVariant.backgroundColor;
        event.currentTarget.style.border = buttonVariant.border;
        event.currentTarget.style.color = buttonVariant.color;
        event.currentTarget.style.boxShadow = "none";
        event.currentTarget.style.transform = "translateY(0)";
      }}
      onMouseDown={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "none";
        onMouseDown(event);
      }}
      onMouseUp={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
        event.currentTarget.style.boxShadow = hoverBoxShadow ?? "none";
      }}
    >
      {label}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-span"
          style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        />
      ))}
    </button>
  );
}

export default Tombol;
