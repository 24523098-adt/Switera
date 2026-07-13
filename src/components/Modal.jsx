import { useEffect, useRef } from "react";
import useRipple from "../hooks/useRipple";

function Modal({ judul, konten, onTutup }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();
  const dialogRef = useRef(null);

  // onTutup dibaca via ref agar efek fokus TIDAK bergantung pada identitas
  // fungsi inline milik pemanggil. Sebelumnya deps [onTutup] membuat efek
  // jalan ulang di SETIAP render induk (setiap ketikan pada input di dalam
  // modal) dan mencuri fokus kembali ke elemen pertama — gejalanya: hanya
  // bisa mengetik satu huruf lalu harus mengklik input lagi.
  const onTutupRef = useRef(onTutup);
  onTutupRef.current = onTutup;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const node = dialogRef.current;
    const getFocusable = () =>
      node?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

    const initialFocusable = getFocusable();
    (initialFocusable && initialFocusable.length > 0 ? initialFocusable[0] : node)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onTutupRef.current?.();
        return;
      }

      if (event.key === "Tab") {
        // Dibaca ulang tiap penekanan Tab agar field yang muncul dinamis
        // (mis. armada/ETA saat status Dalam Pengiriman) ikut masuk trap.
        const focusable = getFocusable();
        if (!focusable || focusable.length === 0) {
          return;
        }

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
    // Sengaja hanya saat mount/unmount modal — bukan setiap render induk.
  }, []);

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
            maxHeight: "calc(100vh - 3rem)",
            overflowY: "auto",
            position: "relative",
            outline: "none",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface)",
            border: "3px solid #000000",
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
                fontWeight: "var(--font-weight-bold)",
                letterSpacing: "var(--tracking-tight)",
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
