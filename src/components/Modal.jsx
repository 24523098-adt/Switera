import { useEffect, useRef } from "react";
import useRipple from "../hooks/useRipple";

function Modal({ judul, konten, onTutup }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const node = dialogRef.current;
    const focusable = node?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable && focusable.length > 0 ? focusable[0] : node)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onTutup?.();
        return;
      }

      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [onTutup]);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={onTutup}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--color-overlay)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          zIndex: "var(--z-modal)",
          animation: "fadeIn 150ms var(--ease-out)",
        }}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "90vw",
            maxWidth: "480px",
            position: "relative",
            outline: "none",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "var(--shadow-lg)",
            padding: "var(--space-8)",
            animation: "scaleIn 200ms var(--ease-out)",
          }}
        >
          <button
            type="button"
            className="modal-close-btn"
            onClick={onTutup}
            aria-label="Tutup modal"
            onMouseDown={onMouseDown}
          >
            ×
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="ripple-span"
                style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
                onAnimationEnd={() => removeRipple(ripple.id)}
              />
            ))}
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "var(--space-6)",
              paddingRight: "2.5rem",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {judul}
            </h2>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-text-secondary)",
            }}
          >
            {konten}
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;
