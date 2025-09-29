import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar styled for dark theme.
 */
export default function Topbar({ right }) {
  return (
    <div
      className="topbar"
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid var(--border-color)',
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
      <div className="right" style={{ marginLeft: 'auto' }}>{right}</div>
    </div>
  );
}
