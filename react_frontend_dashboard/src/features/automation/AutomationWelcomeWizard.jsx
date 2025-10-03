import React, { useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * AutomationWelcomeWizard
 * Minimalist, centered onboarding wizard for Automation with 3 simple steps:
 *  - Step 1: Welcome + introduction with only Next enabled
 *  - Step 2: Requirement selection (Schedule an action, Set a rule, Send an alert)
 *  - Step 3: Contextual placeholder instructions per requirement with Finish
 *
 * Props:
 * - onFinish?: (result: { requirement: string }) => void
 *   Called when the user completes the simple wizard.
 *
 * Design:
 * - Pure White minimalist style, lightweight inline styles matching theme.css tokens.
 * - Fully responsive and centered.
 */
export default function AutomationWelcomeWizard({ onFinish }) {
  const colors = {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    primary: '#374151',
    secondary: '#9CA3AF',
    success: '#10B981',
    border: '#E5E7EB',
  };

  const [step, setStep] = useState(1);
  const [requirement, setRequirement] = useState('');

  const steps = useMemo(
    () => [
      { id: 1, title: 'Welcome', desc: 'A quick, guided setup to get you started with Automation.' },
      { id: 2, title: 'Choose Requirement', desc: 'Select what you want to accomplish.' },
      { id: 3, title: 'Follow Instructions', desc: 'Contextual guidance for your selection.' },
    ],
    []
  );

  const isStepValid = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return !!requirement;
    if (step === 3) return true;
    return false;
  }, [step, requirement]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const RequirementCard = ({ id, title, desc }) => {
    const active = requirement === id;
    return (
      <button
        onClick={() => setRequirement(id)}
        className="req-card"
        style={{
          textAlign: 'left',
          border: `1px solid ${active ? colors.primary : colors.border}`,
          background: active ? colors.surface : 'transparent',
          padding: 14,
          borderRadius: 12,
          cursor: 'pointer',
          color: active ? colors.primary : colors.text,
          minHeight: 84,
        }}
        aria-pressed={active}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ color: colors.secondary, fontSize: 12, marginTop: 6 }}>{desc}</div>
      </button>
    );
  };

  const StepHeader = () => {
    const progress = Math.round((step / steps.length) * 100);
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {steps.map((s) => {
            const isActive = s.id === step;
            return (
              <div
                key={s.id}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? colors.primary : colors.border}`,
                  color: isActive ? colors.primary : colors.secondary,
                  background: isActive ? colors.surface : 'transparent',
                  fontSize: 12,
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                {s.id}. {s.title}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, height: 6, background: colors.surface, borderRadius: 999 }}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{
              height: 6,
              width: `${progress}%`,
              background: colors.primary,
              borderRadius: 999,
              transition: 'width 200ms ease',
            }}
          />
        </div>
        <div style={{ marginTop: 8, color: colors.secondary, fontSize: 12 }}>
          {steps.find((s) => s.id === step)?.desc}
        </div>
      </div>
    );
  };

  const Step1 = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>Welcome to Automation</div>
      <div style={{ marginTop: 8, color: colors.secondary, fontSize: 14 }}>
        Orchestrate schedules and rules to reduce costs and keep workloads healthy.
      </div>
      <div
        style={{
          marginTop: 16,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          borderRadius: 12,
          padding: 12,
          color: colors.text,
          textAlign: 'left',
        }}
      >
        • Create schedules (e.g., stop VMs at 7pm) • Set rules (e.g., scale when CPU > 80%)
      </div>
    </div>
  );

  const Step2 = () => (
    <div>
      <div style={{ color: colors.text, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
        What do you want to do?
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        <RequirementCard
          id="schedule"
          title="Schedule an action"
          desc="Run start/stop/scale at specific times."
        />
        <RequirementCard
          id="rule"
          title="Set a rule"
          desc="Trigger actions based on metrics or thresholds."
        />
        <RequirementCard
          id="alert"
          title="Send an alert"
          desc="Notify when conditions are met (mock)."
        />
      </div>
      <div style={{ marginTop: 10, color: colors.secondary, fontSize: 12 }}>
        You can modify or expand this later in the full wizard.
      </div>
    </div>
  );

  const Step3 = () => {
    const renderContent = () => {
      switch (requirement) {
        case 'schedule':
          return (
            <div>
              <div style={{ fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                Schedule an action
              </div>
              <div style={{ color: colors.secondary, fontSize: 14 }}>
                Placeholder: choose a resource, set a cron (e.g., 0 19 * * 1-5), and pick an action
                like Stop or Start.
              </div>
              <div
                style={{
                  marginTop: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  borderRadius: 10,
                  padding: 10,
                  color: colors.text,
                }}
              >
                Tip: Use UTC to keep schedules consistent across regions.
              </div>
            </div>
          );
        case 'rule':
          return (
            <div>
              <div style={{ fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                Set a rule
              </div>
              <div style={{ color: colors.secondary, fontSize: 14 }}>
                Placeholder: pick metric (e.g., CPU), set condition (e.g., &gt; 80% for 10 min), then
                choose an action like Scale or Alert.
              </div>
              <div
                style={{
                  marginTop: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  borderRadius: 10,
                  padding: 10,
                  color: colors.text,
                }}
              >
                Hint: Start conservative thresholds and iterate.
              </div>
            </div>
          );
        case 'alert':
          return (
            <div>
              <div style={{ fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                Send an alert
              </div>
              <div style={{ color: colors.secondary, fontSize: 14 }}>
                Placeholder: configure a simple condition and send an email/Slack notification. This
                is a mock step for now.
              </div>
              <div
                style={{
                  marginTop: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  borderRadius: 10,
                  padding: 10,
                  color: colors.text,
                }}
              >
                Example: Alert when cost exceeds $100/day.
              </div>
            </div>
          );
        default:
          return (
            <div style={{ color: colors.secondary, fontSize: 14 }}>
              Select a requirement in Step 2 to see instructions.
            </div>
          );
      }
    };

    return <div>{renderContent()}</div>;
  };

  // Centered card wrapper
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-labelledby="aw-title"
        aria-describedby="aw-desc"
        style={{
          width: '100%',
          maxWidth: 720,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <StepHeader />
        <div style={{ padding: 4 }}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 16,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              background: 'transparent',
              color: step === 1 ? colors.secondary : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: '8px 12px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.6 : 1,
            }}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid}
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: isStepValid ? 'pointer' : 'not-allowed',
                opacity: isStepValid ? 1 : 0.6,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                if (onFinish) onFinish({ requirement });
              }}
              style={{
                background: colors.success,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
