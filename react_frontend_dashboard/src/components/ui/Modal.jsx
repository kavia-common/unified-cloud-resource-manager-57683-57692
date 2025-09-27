import React, { useEffect, memo } from "react";

// PUBLIC_INTERFACE
export const Modal = memo(function Modal({ title, open, onClose, children, footer, disableBackdropClose = false, headerActions }) {
  /**
   * Accessible modal dialog with backdrop.
   *
   * Params:
   * - title: string, aria-label/title for dialog
   * - open: boolean, controls visibility (mounted only when true)
   * - onClose: function, called on ESC press, close button, or backdrop click (unless disabled)
   * - children: ReactNode, body content
   * - footer: ReactNode, optional footer actions; defaults to Close button
   * - disableBackdropClose: boolean, if true, clicking the backdrop will not close the modal (default false)
   * - headerActions: ReactNode, optional actions to display next to the close button in the header
   *
   * Returns: a modal dialog element with header, body, and footer regions.
   */
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onClick={disableBackdropClose ? undefined : onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 24, 39, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{
        width: "100%",
        maxWidth: 520,
        background: "#FFFFFF",
        border: "1px solid var(--border, #E5E7EB)",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        overflow: "hidden"
      }}>
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--border, #E5E7EB)", fontWeight: 700 }}>
          <span>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {headerActions}
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
        </div>
        <div className="modal-body" style={{ padding: 14 }}>{children}</div>
        <div className="modal-footer" style={{ padding: 12, display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--border, #E5E7EB)" }}>
          {footer ?? (
            <button className="btn" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
});
