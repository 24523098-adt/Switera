function PageHeader({ judul, deskripsi, aksi }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        paddingBottom: "var(--space-6)",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: "var(--space-6)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
            color: "var(--color-text-primary)",
          }}
        >
          {judul}
        </h1>
        {deskripsi ? (
          <p
            style={{
              margin: "var(--space-1) 0 0",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            {deskripsi}
          </p>
        ) : null}
      </div>
      {aksi ? <div style={{ flexShrink: 0 }}>{aksi}</div> : null}
    </div>
  );
}

export default PageHeader;
