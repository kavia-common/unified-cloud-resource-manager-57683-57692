import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Toast notification styled for dark theme.
 */
export default function Toast({ message }) {
  return (
    <div
      className="Toast"
      role="status"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {message}
    </div>
  );
}
