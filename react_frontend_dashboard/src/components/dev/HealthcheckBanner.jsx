import React, { useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * HealthcheckBanner
 * A lightweight, dismissible banner to confirm that:
 * - App is running
 * - Build is OK
 * - Routes are loaded
 *
 * Styling follows the Pure White theme:
 * - Background: #F9FAFB
 * - Text: #374151 for primary, with subtle accents
 *
 * TODO: Remove this component once preview visibility is confirmed.
 */
export default function HealthcheckBanner() {
  // Generate a timestamp once per mount to display when the page rendered
  const timestamp = useMemo(() => new Date().toLocaleString(), []);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: '#F9FAFB',
        color: '#374151',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
      data-testid="healthcheck-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 0 2px rgba(16,185,129,0.15)',
          }}
        />
        <span style={{ fontWeight: 600 }}>
          App running • Build OK • Routes loaded
        </span>
        <span
          style={{
            color: '#6B7280',
            fontSize: 12,
            borderLeft: '1px solid #E5E7EB',
            paddingLeft: 10,
          }}
        >
          {timestamp}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss healthcheck banner"
        style={{
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#374151',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
