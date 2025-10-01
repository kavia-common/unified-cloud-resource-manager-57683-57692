import React from 'react';
import AutomationPage from './AutomationPage';

/**
 * PUBLIC_INTERFACE
 * Automation
 * Simple wrapper component to render the AutomationPage.
 * Keeps compatibility with existing imports that reference `features/automation/Automation`.
 */
export default function Automation() {
  return <AutomationPage />;
}
