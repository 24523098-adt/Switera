import { useEffect, useState } from "react";

let toasts = [];
let listeners = [];
let idCounter = 0;

function notify() {
  listeners.forEach((listener) => listener(toasts));
}

function dismissToast(id) {
  toasts = toasts.filter((toast) => toast.id !== id);
  notify();
}

function showToast({ type = "info", message, subMessage, duration = 3000, action }) {
  const id = ++idCounter;
  toasts = [...toasts, { id, type, message, subMessage, duration, action }];
  notify();

  if (duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }

  return id;
}

const typeConfig = {
  success: { borderColor: "var(--color-success)", icon: "✓", iconColor: "var(--color-success)" },
  error: { borderColor: "var(--color-danger)", icon: "✕", iconColor: "var(--color-danger)" },
  warning: { borderColor: "var(--color-warning)", icon: "⚠", iconColor: "var(--color-warning)" },
  info: { borderColor: "var(--color-info)", icon: "ℹ", iconColor: "var(--color-info)" },
};

function ToastItem({ toast }) {
  const config = typeConfig[toast.type] ?? typeConfig.info;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration) {
      return undefined;
    }

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [toast.duration]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-5) var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        minWidth: "280px",
        maxWidth: "380px",
        backgroundColor: "var(--color-surface-2)",
        borderLeft: `3px solid ${config.borderColor}`,
        overflow: "hidden",
        animation: "slideInRight 300ms var(--ease-bounce) both",
      }}
    >
      <span style={{ color: config.iconColor, fontSize: "var(--text-md)", flexShrink: 0 }}>
        {config.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
          {toast.message}
        </p>
        {toast.subMessage ? (
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {toast.subMessage}
          </p>
        ) : null}
      </div>
      {toast.action ? (
        <button
          type="button"
          className="toast-action-btn"
          onClick={() => {
            toast.action.onClick();
            dismissToast(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="toast-dismiss-btn"
        onClick={() => dismissToast(toast.id)}
        aria-label="Tutup"
      >
        ×
      </button>
      {toast.duration ? (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: config.borderColor,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: config.borderColor,
              transition: "width 100ms linear",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ToastContainer() {
  const [list, setList] = useState(toasts);

  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((listener) => listener !== setList);
    };
  }, []);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifikasi"
      style={{
        position: "fixed",
        bottom: "var(--space-6)",
        right: "var(--space-6)",
        zIndex: "var(--z-toast)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {list.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function useToast() {
  return { showToast, ToastContainer };
}

export default useToast;
export { showToast, ToastContainer };
