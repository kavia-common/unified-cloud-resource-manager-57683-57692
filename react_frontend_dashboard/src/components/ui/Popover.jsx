import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Small floating container styled for dark theme.
 */
function Popover({ content, children }) {
  return (
    <div
      className="popover"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--border-color)',
        color: 'var(--color-text)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {children}
      <div className="content">{content}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export { Popover };
export default Popover;
