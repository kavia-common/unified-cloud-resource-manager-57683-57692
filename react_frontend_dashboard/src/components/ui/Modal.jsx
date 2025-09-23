import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export function Modal({ title, open, onClose, children, footer }) {
  /** Accessible modal dialog with backdrop. */
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span>{title}</span>
          <button
            type="button"
            aria-label="Close modal"
            className="btn ghost"
            onClick={onClose}
            style={{ borderColor: "var(--border)" }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          {footer ?? (
            <button className="btn" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
