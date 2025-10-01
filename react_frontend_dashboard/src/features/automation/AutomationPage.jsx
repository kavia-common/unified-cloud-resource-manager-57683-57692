import React, { useState } from 'react';
import { AutomationWizard } from './index';

/**
 * PUBLIC_INTERFACE
 * AutomationPage
 * Hosts the Automation Rule creation wizard with a minimalist Pure White theme layout.
 * This page integrates the wizard, shows a simple list of "created" rules (mock),
 * and demonstrates handling of the wizard submission payload via a toast-like banner.
 */
export default function AutomationPage() {
  const [createdRules, setCreatedRules] = useState([]);
  const [banner, setBanner] = useState(null);

  const colors = {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    primary: '#374151',
    secondary: '#9CA3AF',
    success: '#10B981',
    border: '#E5E7EB',
  };

  const handleSubmit = (payload) => {
    // Simulate saving and display feedback
    const id = `${Date.now()}`;
    setCreatedRules((prev) => [{ id, ...payload }, ...prev]);
    setBanner({ type: 'success', message: 'Automation rule created (mock).' });
    // Auto-dismiss
    setTimeout(() => setBanner(null), 2200);
  };

  const handleCancel = () => {
    setBanner({ type: 'info', message: 'Wizard canceled.' });
    setTimeout(() => setBanner(null), 1500);
  };

  return (
    <div style={{ padding: 16, background: colors.background, minHeight: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: colors.text, fontSize: 20, fontWeight: 700 }}>
          Automation
        </h2>
        <div style={{ color: colors.secondary, fontSize: 13, marginTop: 6 }}>
          Follow the guided steps below to create automation rules using schedules or thresholds.
        </div>
      </div>

      {banner ? (
        <div
          role="status"
          style={{
            border: `1px solid ${colors.border}`,
            background: banner.type === 'success' ? '#ECFDF5' : colors.surface,
            color: colors.text,
            padding: '10px 12px',
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {banner.message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr' }}>
        <section
          aria-label="Create Automation Rule"
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            background: colors.background,
          }}
        >
          <div style={{ marginBottom: 12, color: colors.text, fontWeight: 600 }}>
            Create Automation Rule
          </div>
          <AutomationWizard onSubmit={handleSubmit} onCancel={handleCancel} />
        </section>

        <section
          aria-label="Existing Rules"
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            background: colors.background,
          }}
        >
          <div style={{ marginBottom: 12, color: colors.text, fontWeight: 600 }}>
            Recently Created Rules (Mock)
          </div>
          {createdRules.length === 0 ? (
            <div
              style={{
                color: colors.secondary,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 12,
              }}
            >
              No rules yet. Use the wizard above to create your first automation rule.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {createdRules.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: 12,
                    background: colors.surface,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ color: colors.text, fontWeight: 600 }}>
                      {r.resourceType?.toUpperCase()} • {r.trigger?.type?.toUpperCase()}
                    </div>
                    <div style={{ color: colors.secondary, fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ marginTop: 6, color: colors.text, fontSize: 14 }}>
                    {r.trigger?.type === 'time' ? (
                      <span>
                        Cron: <strong>{r.trigger?.time?.cron}</strong> — TZ:{' '}
                        <strong>{r.trigger?.time?.timezone}</strong>
                      </span>
                    ) : (
                      <span>
                        {r.trigger?.threshold?.metric} {r.trigger?.threshold?.operator}{' '}
                        {r.trigger?.threshold?.value} for {r.trigger?.threshold?.durationMins}m
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 6, color: colors.text, fontSize: 14 }}>
                    Actions:{' '}
                    <strong>
                      {r.actions
                        ?.map((a) => (a.id === 'scale' ? `Scale(to:${a.params?.to})` : a.id))
                        .join(', ')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
