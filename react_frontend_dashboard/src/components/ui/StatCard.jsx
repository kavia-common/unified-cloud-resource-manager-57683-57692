import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Metric card styled for minimalist light theme with a subtle on-brand blue gradient background.
 */
export default function StatCard({ title, value, icon, subtitle }) {
  // Use updated theme gradient var for dark blue → violet. Provide a sensible fallback.
  const gradientBg =
    'var(--card-accent-gradient, linear-gradient(135deg, #2563EB 0%, #4F46E5 48%, #7C3AED 100%))';

  return (
    <div
      className="stat-card"
      style={{
        background: gradientBg,
        border: '1px solid rgba(255,255,255,0.14)', // softer border on dark gradient
        borderRadius: 'var(--radius-md)',
        padding: 16,
        boxShadow: 'var(--shadow-sm)',
        color: '#FFFFFF', // ensure contrast on dark gradient
      }}
    >
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {icon && <span className="icon" aria-hidden>{icon}</span>}
        <div className="title" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{title}</div>
      </div>
      <div className="value" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {subtitle && <div className="subtitle" style={{ marginTop: 6, color: 'rgba(255,255,255,0.8)' }}>{subtitle}</div>}
    </div>
  );
}
