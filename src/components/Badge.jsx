const statusMap = {
  menunggu: {
    backgroundColor: "var(--color-warning-subtle)",
    color: "var(--color-warning)",
    label: "Menunggu",
  },
  "dalam-pengiriman": {
    backgroundColor: "var(--color-info-subtle)",
    color: "var(--color-info)",
    label: "Dalam Pengiriman",
  },
  selesai: {
    backgroundColor: "var(--color-success-subtle)",
    color: "var(--color-success)",
    label: "Selesai",
  },
  dibatalkan: {
    backgroundColor: "var(--color-danger-subtle)",
    color: "var(--color-danger)",
    label: "Dibatalkan",
  },
};

function Badge({ status }) {
  const config = statusMap[status] ?? {
    backgroundColor: "var(--color-text-secondary)",
    color: "var(--color-surface)",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        padding: "3px 8px",
        borderRadius: "var(--radius-xs)",
        backgroundColor: config.backgroundColor,
        color: config.color,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--font-weight-semibold)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wider)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "var(--radius-full)",
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}

export default Badge;
