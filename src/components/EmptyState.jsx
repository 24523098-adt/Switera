function EmptyState({ pesan }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--space-16) var(--space-8)",
        gap: "var(--space-4)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "80px",
          height: "80px",
          flexShrink: 0,
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
          backgroundColor: "var(--color-surface-2)",
          borderRadius: "var(--radius-full)",
          padding: "20px",
          outline: "1px solid var(--color-border-strong)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 8.5C3 7.67157 3.67157 7 4.5 7H9.17157C9.5631 7 9.93701 7.15804 10.2071 7.42L11.5 8.5H18.5C19.3284 8.5 20 9.17157 20 10V10.5"
            stroke="var(--color-text-muted)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 10.5H19C19.8757 10.5 20.5828 11.2483 20.4848 12.1187L19.6071 19.7187C19.5217 20.4805 18.8788 21.0625 18.1121 21.0625H4.85537C4.05653 21.0625 3.40076 20.4339 3.36906 19.6357L3.5 10.5Z"
            stroke="var(--color-text-muted)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-md)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-text-secondary)",
        }}
      >
        Belum ada data
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        {pesan}
      </p>
    </div>
  );
}

export default EmptyState;
