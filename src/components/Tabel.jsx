import { useEffect, useMemo, useRef, useState } from "react";

const ROW_EXIT_MS = 200;

const PAGE_SIZE = 10;

const resolveColumn = (column) =>
  typeof column === "string"
    ? {
        key: column,
        label: column,
      }
    : column;

const isPrimitive = (value) =>
  value === undefined ||
  value === null ||
  typeof value === "string" ||
  typeof value === "number";

const isColumnSortable = (column, data) =>
  data.length > 0 && data.every((row) => isPrimitive(row[column.key]));

const compareValues = (a, b, numeric) => {
  if (a == null) return -1;
  if (b == null) return 1;

  if (numeric) {
    const numA = parseFloat(String(a).replace(/[^\d.-]/g, "")) || 0;
    const numB = parseFloat(String(b).replace(/[^\d.-]/g, "")) || 0;
    return numA - numB;
  }

  return String(a).localeCompare(String(b), "id-ID", { numeric: true });
};

function IkonSort({ direction }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        fontSize: "9px",
        lineHeight: 1,
        opacity: direction ? 1 : 0.3,
        color: direction ? "var(--color-primary)" : "currentColor",
      }}
    >
      {direction === "desc" ? "▼" : "▲"}
    </span>
  );
}

function IkonDensity({ compact }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={compact ? "M4 7H20M4 12H20M4 17H20" : "M4 5H20M4 12H20M4 19H20"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Tabel({ kolom = [], data = [], aksi, getRowStyle }) {
  const normalizedColumns = kolom.map(resolveColumn);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState("comfortable");
  const [exitingRows, setExitingRows] = useState([]);
  const prevDataRef = useRef(data);

  // Row delete animation (fadeOut + collapse): React unmounts a removed row
  // immediately with no exit frame, so a removed row is held in local state
  // for ROW_EXIT_MS with the .row-exit class before being dropped for real.
  // Only handled for the common single-page case here — once pagination is
  // active, a removed row's original page position can't be reconstructed
  // reliably, so it simply disappears (still correct, just not animated).
  useEffect(() => {
    if (data.length <= PAGE_SIZE) {
      const currentIds = new Set(data.map((row, index) => row.id ?? index));
      const removed = prevDataRef.current.filter(
        (row, index) => !currentIds.has(row.id ?? index)
      );
      if (removed.length > 0) {
        setExitingRows((current) => [...current, ...removed]);
        const timeoutId = window.setTimeout(() => {
          setExitingRows((current) =>
            current.filter((row) => !removed.includes(row))
          );
        }, ROW_EXIT_MS);
        prevDataRef.current = data;
        return () => window.clearTimeout(timeoutId);
      }
    }
    prevDataRef.current = data;
    return undefined;
  }, [data]);

  useEffect(() => {
    setPage(0);
  }, [data.length, sortConfig.key, sortConfig.direction]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) {
      return data;
    }

    const column = normalizedColumns.find((col) => col.key === sortConfig.key);
    if (!column) {
      return data;
    }

    return [...data].sort((a, b) => {
      const result = compareValues(a[column.key], b[column.key], column.numeric);
      return sortConfig.direction === "asc" ? result : -result;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pagedData =
    sortedData.length > PAGE_SIZE
      ? sortedData.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE)
      : sortedData;

  const handleSort = (column) => {
    setSortConfig((current) => {
      if (current.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }
      return { key: null, direction: "asc" };
    });
  };

  const isCompact = density === "compact";

  const headerCellStyle = {
    padding: isCompact ? "6px 16px" : "10px 16px",
    textAlign: "left",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-2xs)",
    fontWeight: "var(--font-weight-semibold)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wider)",
    userSelect: "none",
    backgroundColor: "var(--color-bg)",
  };

  const getCellStyle = (isLastRow) => ({
    padding: isCompact ? "6px 16px" : "12px 16px",
    borderBottom: isLastRow ? "none" : "1px solid var(--color-border-subtle)",
    color: "var(--color-text-primary)",
    verticalAlign: "middle",
    fontSize: "var(--text-sm)",
    transition: "background-color 80ms ease",
  });

  const paginationButtonStyle = (disabled) => ({
    border: "1px solid var(--color-border-mid)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-surface-2)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-secondary)",
    padding: "5px 10px",
    fontSize: "var(--text-xs)",
    fontFamily: "var(--font-body)",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const densityButtonStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-sm)",
    backgroundColor: active ? "var(--color-primary-subtle)" : "var(--color-surface-2)",
    color: active ? "var(--color-primary)" : "var(--color-text-muted)",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        animation: "fadeInUp 250ms var(--ease-spring) both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", padding: "6px 8px", borderBottom: "1px solid var(--color-border)" }}>
        <button
          type="button"
          aria-label="Tampilan nyaman"
          aria-pressed={!isCompact}
          onClick={() => setDensity("comfortable")}
          style={densityButtonStyle(!isCompact)}
        >
          <IkonDensity compact={false} />
        </button>
        <button
          type="button"
          aria-label="Tampilan ringkas"
          aria-pressed={isCompact}
          onClick={() => setDensity("compact")}
          style={densityButtonStyle(isCompact)}
        >
          <IkonDensity compact />
        </button>
      </div>

      <div className="app-table-scroll" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: "560px",
            borderCollapse: "collapse",
            fontFamily: "var(--font-body)",
            color: "var(--color-text-primary)",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              borderBottom: "1px solid var(--color-border-mid)",
            }}
          >
            <tr>
              {normalizedColumns.map((column) => {
                const sortable = isColumnSortable(column, data);
                const isActive = sortConfig.key === column.key;

                return (
                  <th
                    key={column.key}
                    style={{
                      ...headerCellStyle,
                      cursor: sortable ? "pointer" : "default",
                    }}
                    onClick={sortable ? () => handleSort(column) : undefined}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      {column.label}
                      {sortable ? <IkonSort direction={isActive ? sortConfig.direction : null} /> : null}
                    </span>
                  </th>
                );
              })}
              {aksi ? <th style={headerCellStyle}>Aksi</th> : null}
            </tr>
          </thead>
          <tbody className="stagger-children">
            {pagedData.map((baris, index) => {
              const rowId = baris.id ?? index;
              const isRowHovered = hoveredRow === rowId;
              const isLastRow = index === pagedData.length - 1;
              const customBackground = getRowStyle?.(baris, index)?.backgroundColor;
              const rowBackground = isRowHovered
                ? "rgba(0, 106, 67, 0.04)"
                : customBackground ?? "transparent";
              const cellStyle = getCellStyle(isLastRow);

              return (
                <tr
                  key={rowId}
                  onMouseEnter={() => setHoveredRow(rowId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ animation: "fadeInUp 300ms var(--ease-smooth) both" }}
                >
                  {normalizedColumns.map((column, colIndex) => (
                    <td
                      key={`${rowId}-${column.key}`}
                      style={{
                        ...cellStyle,
                        backgroundColor: rowBackground,
                        borderLeft:
                          colIndex === 0
                            ? isRowHovered
                              ? "2px solid var(--color-primary)"
                              : "2px solid transparent"
                            : undefined,
                        fontFamily: column.numeric ? "var(--font-mono)" : undefined,
                        fontVariantNumeric: column.numeric ? "tabular-nums" : undefined,
                      }}
                    >
                      {baris[column.key] ?? "-"}
                    </td>
                  ))}
                  {aksi ? (
                    <td style={{ ...cellStyle, backgroundColor: rowBackground }}>
                      {aksi(baris, index)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {exitingRows.map((baris, index) => {
              const rowId = `exiting-${baris.id ?? index}`;
              const cellStyle = getCellStyle(true);

              return (
                <tr key={rowId} className="row-exit" aria-hidden="true">
                  {normalizedColumns.map((column) => (
                    <td key={`${rowId}-${column.key}`} style={cellStyle}>
                      {baris[column.key] ?? "-"}
                    </td>
                  ))}
                  {aksi ? <td style={cellStyle} /> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedData.length > PAGE_SIZE ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>
            Menampilkan {clampedPage * PAGE_SIZE + 1}–
            {Math.min((clampedPage + 1) * PAGE_SIZE, sortedData.length)} dari {sortedData.length}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={clampedPage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              style={paginationButtonStyle(clampedPage === 0)}
            >
              ‹ Sebelumnya
            </button>
            <button
              type="button"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              style={paginationButtonStyle(clampedPage >= totalPages - 1)}
            >
              Berikutnya ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Tabel;
