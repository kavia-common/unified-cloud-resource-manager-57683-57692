import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Metric card styled for dark theme.
 */
export default function StatCard({ title, value, icon, subtitle }) {
  return (
    <div
      className="stat-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--color-text)',
      }}
    >
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {icon && <span className="icon" aria-hidden>{icon}</span>}
        <div className="title" style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{title}</div>
      </div>
      <div className="value" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {subtitle && <div className="subtitle text-subtle" style={{ marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}
