import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Accessible, minimalist centered modal dialog styled by theme variables (dark by default).
 *
 * Props:
 * - open: boolean to control visibility
 * - onClose: function to close the modal
 * - title: string or node for header title
 * - children: modal body content
 * - footer: optional footer actions
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
        background: 'var(--overlay)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
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
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {(title || headerActions) && (
          <div
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--border)',
              padding: '14px 16px',
              background: 'var(--surface)',
            }}
          >
            {title && (
              <div
                id="modal-title"
                style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1.1 }}
              >
                {title}
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {headerActions}
            </div>
          </div>
        )}

        <div
          className="modal-body"
          style={{
            padding: 16,
            background: 'var(--surface)',
            color: 'var(--text-muted)',
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              borderTop: '1px solid var(--border)',
              padding: '12px 16px',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              background: 'var(--surface)',
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
