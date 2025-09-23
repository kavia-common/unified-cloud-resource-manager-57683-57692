import React, { useEffect, memo } from "react";

// PUBLIC_INTERFACE
export const Modal = memo(function Modal({ title, open, onClose, children, footer, disableBackdropClose = false }) {
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
    >
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
});
