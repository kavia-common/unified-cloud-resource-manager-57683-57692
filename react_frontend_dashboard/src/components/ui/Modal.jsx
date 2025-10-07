import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Accessible, minimalist centered modal dialog using theme tokens and shared .btn classes.
 *
 * Props:
 * - open: boolean to control visibility
 * - onClose: function to close the modal
 * - title: string or node for header title
 * - children: modal body content
 * - footer: optional footer actions (React node)
 * - disableBackdropClose: optional boolean to prevent closing on backdrop click
 * - headerActions: optional right-aligned header actions (e.g., icon buttons)
 */
function Modal({ open, onClose, title, children, footer, disableBackdropClose = false, headerActions = null }) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (disableBackdropClose) return;
    onClose?.(e);
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="modal modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {(title || headerActions) && (
          <div
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--color-border)',
              padding: '14px 16px',
              background: 'var(--color-surface)',
            }}
          >
            {title && (
              <div
                id="modal-title"
                style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', lineHeight: 1.1 }}
              >
                {title}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {headerActions}
              <button className="btn btn--ghost btn--sm" aria-label="Close" onClick={onClose}>✕</button>
            </div>
          </div>
        )}

        <div
          className="modal-body"
          style={{
            padding: 16,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '12px 16px',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              background: 'var(--color-surface)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export { Modal }; // named export for compatibility
export default Modal;
