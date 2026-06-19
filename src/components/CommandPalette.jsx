import { useEffect, useMemo, useRef, useState } from "react";

function IkonSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="var(--color-text-muted)" strokeWidth="1.8" />
      <path
        d="M20 20L16.5 16.5"
        stroke="var(--color-text-muted)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommandPalette({ isOpen, onClose, menuItems, onNavigate }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setQuery("");
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return menuItems;
    }

    return menuItems.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [menuItems, query]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (key) => {
    onNavigate(key);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--color-overlay)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "12vh",
        animation: "fadeInUp 150ms var(--ease-smooth)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 16px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <IkonSearch />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari halaman..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
            }}
          />
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 6px",
            }}
          >
            Esc
          </span>
        </div>

        <div style={{ maxHeight: "320px", overflowY: "auto", padding: "6px" }}>
          {filtered.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "20px",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Tidak ditemukan.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  transition: "background-color var(--transition-fast)",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
