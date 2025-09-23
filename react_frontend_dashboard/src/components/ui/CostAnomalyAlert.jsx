import React from 'react';

/**
 * PUBLIC_INTERFACE
 * CostAnomalyAlert component
 * A visually prominent, minimalist alert card to display cost anomaly messages.
 * Props:
 * - message: string - the alert text to display
 * - provider: string (optional) - cloud provider label to show an icon/badge context
 * - className: string (optional) - extra classes to override spacing or layout
 */
export default function CostAnomalyAlert({ message = 'Cost spike detected on Azure: +27% week-on-week', provider = 'Azure', className = '' }) {
  // Colors based on Pure White theme
  const colors = {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    error: '#EF4444',
    secondary: '#9CA3AF',
  };

  // Simple provider badge color mapping (can be extended later)
  const providerBadgeColor = {
    AWS: '#F59E0B', // amber-500
    Azure: '#3B82F6', // blue-500
    GCP: '#10B981', // emerald-500
    Default: colors.secondary,
  }[provider] || colors.secondary;

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className={`cost-anomaly-alert ${className}`}
      style={{
        backgroundColor: colors.background,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          borderRadius: '12px',
          padding: '14px 16px',
          backgroundColor: colors.surface,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px rgba(17, 24, 39, 0.04)',
        }}
      >
        {/* Alert icon */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: '#FEE2E2', // red-100
            color: colors.error,
          }}
        >
          {/* Simple inline alert icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" role="img">
            <path d="M11.001 10h2v5h-2v-5zm0 7h2v2h-2v-2z"></path>
            <path d="M1 21h22L12 2 1 21zm12-3h-2v2h2v-2zm0-7h-2v5h2v-5z"></path>
          </svg>
        </div>

        {/* Message and meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 14,
                lineHeight: '20px',
                fontWeight: 600,
                color: colors.error,
                letterSpacing: '0.2px',
              }}
            >
              Cost Anomaly
            </span>
            <span
              aria-label={`${provider} provider`}
              style={{
                fontSize: 12,
                lineHeight: '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: providerBadgeColor,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {provider}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: '20px',
              color: colors.text,
              wordBreak: 'break-word',
            }}
          >
            {message}
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              aria-label="View costs details"
              style={{
                fontSize: 13,
                lineHeight: '18px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                padding: '8px 12px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
              onClick={() => {
                // Placeholder interaction; integrate routing as needed
                // e.g., navigate('/costs')
                // eslint-disable-next-line no-console
                console.log('View details clicked');
              }}
            >
              View details
            </button>
            <button
              type="button"
              aria-label="Snooze alert"
              style={{
                fontSize: 13,
                lineHeight: '18px',
                fontWeight: 600,
                color: colors.error,
                backgroundColor: '#FFFFFF',
                border: '1px solid #FECACA', // red-200
                padding: '8px 12px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
              onClick={() => {
                // Placeholder interaction; wire to state or backend later
                // eslint-disable-next-line no-console
                console.log('Snooze clicked');
              }}
            >
              Snooze
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
