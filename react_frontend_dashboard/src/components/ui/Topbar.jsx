import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar styled to use theme tokens.
 * Accepts optional "right" node for custom actions.
 */
export default function Topbar({ right }) {
  return (
    <div
      className="topbar"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        color: 'var(--color-text)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="title" style={{ fontWeight: 600, color: 'var(--color-text)' }}>Cloud Manager</div>
      <div className="right" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {right || null}
      </div>
    </div>
  );
}
