import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Toast primitives: Provider, hook, and container UI.
 * Position: top-right
 * Variants: success | error | info
 */

// PUBLIC_INTERFACE
export const ToastContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export function ToastProvider({ children, placement = "top-right", defaultDuration = 4000 }) {
  /**
   * Provides toast API: show({ type, message, duration }), success(msg), error(msg), info(msg)
   */
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", message, duration = defaultDuration }) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, type, message }]);
      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [defaultDuration, remove]
  );

  const api = useMemo(
    () => ({
      show,
      success: (message, duration) => show({ type: "success", message, duration }),
      error: (message, duration) => show({ type: "error", message, duration }),
      info: (message, duration) => show({ type: "info", message, duration }),
      remove,
    }),
    [show, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} placement={placement} onClose={remove} />
    </ToastContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to access toast API from anywhere under provider */
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

function ToastContainer({ toasts, placement, onClose }) {
  const posStyle =
    placement === "top-right"
      ? { top: 16, right: 16 }
      : placement === "top-left"
      ? { top: 16, left: 16 }
      : placement === "bottom-right"
      ? { bottom: 16, right: 16 }
      : { bottom: 16, left: 16 };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        zIndex: 100,
        display: "grid",
        gap: 8,
        ...posStyle,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const { type, message } = toast;
  const stylesByType = {
    success: {
      borderColor: "rgba(16,185,129,0.45)",
      background: "linear-gradient(180deg, rgba(16,185,129,0.14), rgba(16,185,129,0.06))",
      color: "#064E3B",
    },
    error: {
      borderColor: "rgba(239,68,68,0.45)",
      background: "linear-gradient(180deg, rgba(239,68,68,0.14), rgba(239,68,68,0.06))",
      color: "#7F1D1D",
    },
    info: {
      borderColor: "rgba(55,65,81,0.35)",
      background: "linear-gradient(180deg, rgba(55,65,81,0.08), rgba(55,65,81,0.04))",
      color: "#111827",
    },
  };
  const style = stylesByType[type] || stylesByType.info;

  // basic mount-in animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="alert"
      className="toast"
      style={{
        minWidth: 260,
        maxWidth: 360,
        border: `1px solid ${style.borderColor}`,
        background: style.background,
        color: style.color,
        borderRadius: 10,
        boxShadow: "0 10px 24px rgba(55, 65, 81, 0.12), 0 3px 6px rgba(0,0,0,0.06)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transform: `translateY(${mounted ? 0 : -6}px)`,
        opacity: mounted ? 1 : 0,
        transition: "transform .18s ease, opacity .18s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background:
            type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#374151",
        }}
      />
      <div style={{ fontSize: 13, lineHeight: 1.3, flex: 1 }}>{message}</div>
      <button
        aria-label="Dismiss notification"
        className="btn ghost"
        onClick={onClose}
        style={{ borderColor: "transparent" }}
      >
        ✕
      </button>
    </div>
  );
}
