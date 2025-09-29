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
        background: 'rgba(20,26,36,0.7)',
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
      <div className="title" style={{ fontWeight: 600 }}>Cloud Manager</div>
      <div className="right" style={{ marginLeft: 'auto' }}>{right}</div>
    </div>
  );
}
