import { useState } from "react";
import { SkeletonTable } from "./Skeleton";
import useMountSkeleton from "../hooks/useMountSkeleton";

const resolveColumn = (column) =>
  typeof column === "string"
    ? {
        key: column,
        label: column,
      }
    : column;

function Tabel({ kolom = [], data = [], aksi, getRowStyle }) {
  const normalizedColumns = kolom.map(resolveColumn);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const isLoading = useMountSkeleton(450);

  if (isLoading) {
    return <SkeletonTable kolom={kolom} aksi={Boolean(aksi)} />;
  }

  const allSelected = data.length > 0 && selectedIds.size === data.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(data.map((baris, index) => baris.id ?? index)));
  };

  const toggleRow = (rowId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

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

  const getCellStyle = (isLastRow) => ({
    padding: "12px 16px",
    borderBottom: isLastRow ? "none" : "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    verticalAlign: "top",
    fontSize: "var(--text-sm)",
    transition: "background-color var(--transition-fast)",
  });

  const checkboxStyle = {
    width: "14px",
    height: "14px",
    accentColor: "var(--color-primary)",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        animation: "fadeInUp 300ms var(--ease-smooth) both",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
          color: "var(--color-text-primary)",
        }}
      >
        <thead
          style={{
            backgroundColor: "var(--color-surface-2)",
            borderBottom: "1px solid var(--color-border-mid)",
          }}
        >
          <tr>
            <th style={{ ...headerCellStyle, width: "36px" }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Pilih semua baris"
                style={checkboxStyle}
              />
            </th>
            {normalizedColumns.map((column) => (
              <th key={column.key} style={headerCellStyle}>
                {column.label}
              </th>
            ))}
            {aksi ? <th style={headerCellStyle}>Aksi</th> : null}
          </tr>
        </thead>
        <tbody className="stagger-children">
          {data.map((baris, index) => {
            const rowId = baris.id ?? index;
            const isRowHovered = hoveredRow === rowId;
            const isRowSelected = selectedIds.has(rowId);
            const isLastRow = index === data.length - 1;
            const customBackground = getRowStyle?.(baris, index)?.backgroundColor;
            const rowBackground = isRowSelected
              ? "var(--color-primary-subtle)"
              : isRowHovered
                ? "var(--color-surface-hover)"
                : customBackground ?? "transparent";
            const cellStyle = getCellStyle(isLastRow);

            return (
              <tr
                key={rowId}
                onMouseEnter={() => setHoveredRow(rowId)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ animation: "fadeInUp 300ms var(--ease-smooth) both" }}
              >
                <td style={{ ...cellStyle, backgroundColor: rowBackground }}>
                  <input
                    type="checkbox"
                    checked={isRowSelected}
                    onChange={() => toggleRow(rowId)}
                    aria-label="Pilih baris"
                    style={checkboxStyle}
                  />
                </td>
                {normalizedColumns.map((column) => (
                  <td
                    key={`${rowId}-${column.key}`}
                    style={{
                      ...cellStyle,
                      backgroundColor: rowBackground,
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
        </tbody>
      </table>
    </div>
  );
}

export default Tabel;
