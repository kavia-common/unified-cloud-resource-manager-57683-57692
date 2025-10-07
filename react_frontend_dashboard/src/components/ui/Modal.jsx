import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Accessible, minimalist centered modal dialog styled for the app's light theme.
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
        background: 'rgba(17, 24, 39, 0.35)', // subtle dim
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
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
          maxWidth: 640,            // mini panel size
          background: '#FFFFFF',
          color: '#111827',
          border: '1px solid #E5E7EB',
          borderRadius: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
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
              borderBottom: '1px solid #E5E7EB',
              padding: '14px 16px',
              background: '#FFFFFF',
            }}
          >
            {title && (
              <div
                id="modal-title"
                style={{ fontWeight: 700, fontSize: 16, color: '#111827', lineHeight: 1.1 }}
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
            background: '#FFFFFF',
            color: '#374151',
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="modal-footer"
            style={{
              borderTop: '1px solid #E5E7EB',
              padding: '12px 16px',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              background: '#FFFFFF',
            }}
          >
            {footer}
          </div>
        )}
      </div>

      {/* Light theme utility tokens to ensure consistency */}
      <style>{`
        :root {
          --muted: #6B7280;
          --error: #EF4444;
          --border-color: #E5E7EB;
          --color-text: #111827;
          --color-text-muted: #6B7280;
          --color-primary: #111827;
          --color-surface: #FFFFFF;
        }
        .btn {
          background: #F3F4F6;
          color: #111827;
          border: 1px solid #E5E7EB;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn:hover { background: #E5E7EB; }
        .btn.primary {
          background: #111827;
          color: #FFFFFF;
          border-color: #111827;
        }
        .panel {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
          border: 1px solid #E5E7EB;
          background: #F9FAFB;
          color: #111827;
        }
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          background: #FFFFFF;
          color: #111827;
          outline: none;
        }
        .input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17,24,39,0.15);
        }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 14px; }
      `}</style>
    </div>
  );
}

// PUBLIC_INTERFACE
export { Modal }; // named export for compatibility
export default Modal;
