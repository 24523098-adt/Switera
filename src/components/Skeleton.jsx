const resolveColumnLabel = (column) =>
  typeof column === "string" ? column : column.label ?? column.key;

export function SkeletonBlock({ width = "100%", height = "1rem", style, ...props }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function SkeletonTable({ kolom = [], aksi = false, rows = 5 }) {
  const columnCount = kolom.length + (aksi ? 1 : 0);

  const headerCellStyle = {
    padding: "10px 16px",
    textAlign: "left",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-2xs)",
    fontWeight: "var(--font-weight-semibold)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
  };

  const cellStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead
          style={{
            backgroundColor: "var(--color-surface-2)",
            borderBottom: "1px solid var(--color-border-mid)",
          }}
        >
          <tr>
            <th style={{ ...headerCellStyle, width: "36px" }} />
            {kolom.map((column, index) => (
              <th key={`${resolveColumnLabel(column)}-${index}`} style={headerCellStyle}>
                {resolveColumnLabel(column)}
              </th>
            ))}
            {aksi ? <th style={headerCellStyle}>Aksi</th> : null}
          </tr>
        </thead>
        <tbody className="stagger-children">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              style={{ animation: "fadeInUp 300ms var(--ease-smooth) both" }}
            >
              <td style={cellStyle}>
                <SkeletonBlock height="0.9rem" width="14px" />
              </td>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <td key={colIndex} style={cellStyle}>
                  <SkeletonBlock height="0.9rem" width={colIndex === 0 ? "55%" : "85%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonChart({ height = "320px" }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        height,
        width: "100%",
        borderRadius: "var(--radius-md)",
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonStatCard({ accent = "var(--color-border)" }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        borderTop: `4px solid ${accent}`,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <SkeletonBlock height="0.85rem" width="55%" />
      <SkeletonBlock height="1.8rem" width="70%" />
      <SkeletonBlock height="0.85rem" width="90%" />
    </div>
  );
}
