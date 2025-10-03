import React from 'react';
import { AutomationWelcomeWizard } from './index';

/**
 * PUBLIC_INTERFACE
 * AutomationPage
 * Minimalist Automation page that renders only the step-by-step welcome/onboarding wizard.
 * All other advanced wizards, lists, banners, and extras have been removed intentionally.
 */
export default function AutomationPage() {
  const colors = {
    background: '#FFFFFF',
    text: '#111827',
    secondary: '#9CA3AF',
  };

  return (
    <div style={{ padding: 16, background: colors.background, minHeight: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: colors.text, fontSize: 20, fontWeight: 700 }}>
          Automation
        </h2>
        <div style={{ color: colors.secondary, fontSize: 13, marginTop: 6 }}>
          Follow the simple guided steps to get started with Automation.
        </div>
      </div>

      <AutomationWelcomeWizard />
    </div>
  );
}
