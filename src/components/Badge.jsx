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

  // Status "aktif" (menunggu proses / dalam perjalanan) diberi pulse dot.
  const isActiveStatus = status === "menunggu" || status === "dalam-pengiriman";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        backgroundColor: config.backgroundColor,
        color: config.color,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--font-weight-semibold)",
        letterSpacing: "var(--tracking-wide)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        className={isActiveStatus ? "animate-pulse-dot" : undefined}
        style={{
          width: "6px",
          height: "6px",
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
