import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Accessible modal dialog that uses dark theme tokens.
 * Props:
 * - open: boolean to control visibility
 * - onClose: function to close the modal
 * - title: string or node for header title
 * - children: modal body content
 * - footer: optional footer actions
 */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            id="modal-title"
            className="modal-header"
            style={{
              borderBottom: '1px solid var(--border-color)',
              padding: '14px 16px',
              color: 'var(--color-text)',
            }}
          >
            {title}
          </div>
        )}
        <div
          className="modal-body"
          style={{ padding: '16px', color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="modal-footer"
            style={{
              borderTop: '1px solid var(--border-color)',
              padding: '12px 16px',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              background: 'var(--color-surface)'
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
