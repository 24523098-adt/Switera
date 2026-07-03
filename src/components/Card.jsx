const accentColors = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
};

function Card({ children, style, hoverable = false, accent, shimmer = false, className, ...props }) {
  const combinedClassName = [
    "app-card",
    hoverable ? "app-card-hoverable" : "",
    shimmer ? "card-shimmer" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...props}
      className={combinedClassName}
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: accent ? `2px solid ${accentColors[accent] ?? accentColors.primary}` : undefined,
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-6)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
