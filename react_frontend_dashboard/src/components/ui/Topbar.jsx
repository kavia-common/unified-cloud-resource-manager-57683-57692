import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar uses theme tokens to support dark/light without layout changes.
 */
export default function Topbar({ right }) {
  return (
    <div
      className="topbar"
      style={{
        background: 'color-mix(in oklab, var(--surface) 80%, transparent)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="title" style={{ fontWeight: 600, color: 'var(--text)' }}>Cloud Manager</div>
      <div className="right" style={{ marginLeft: 'auto' }}>
        {right || null}
      </div>
    </div>
  );
}
