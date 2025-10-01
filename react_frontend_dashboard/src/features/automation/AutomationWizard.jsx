import React, { useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * AutomationWizard
 * A minimalist, step-by-step wizard to create automation rules:
 *  1) Select resource type
 *  2) Define trigger/condition (time or threshold)
 *  3) Choose one or more actions
 *
 * Also includes an optional natural language input that simulates AI parsing to prefill the form.
 * This component uses mock data and a stubbed AI handler only.
 */
export default function AutomationWizard({ onSubmit, onCancel }) {
  // Theme colors per Pure White minimalist style
  const colors = {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    primary: '#374151',
    secondary: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
    border: '#E5E7EB',
    focus: '#2563EB',
  };

  // Mocked data
  const resourceTypes = useMemo(
    () => [
      { id: 'ec2', label: 'AWS EC2 Instance' },
      { id: 'rds', label: 'AWS RDS Database' },
      { id: 'aks', label: 'Azure AKS Cluster' },
      { id: 'vm', label: 'Azure VM' },
      { id: 'k8s', label: 'Kubernetes Deployment' },
    ],
    []
  );

  const actionsCatalog = useMemo(
    () => [
      { id: 'start', label: 'Start' },
      { id: 'stop', label: 'Stop' },
      { id: 'scale', label: 'Scale' },
      { id: 'delete', label: 'Delete' },
      { id: 'alert', label: 'Send Alert' },
    ],
    []
  );

  // State
  const [step, setStep] = useState(1);
  const [nlMode, setNlMode] = useState(false);
  const [nlText, setNlText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const [resourceType, setResourceType] = useState('');
  const [triggerType, setTriggerType] = useState('time'); // 'time' or 'threshold'

  // Time trigger fields
  const [timeCron, setTimeCron] = useState('0 8 * * *'); // default 8 AM daily
  const [timeTimezone, setTimeTimezone] = useState('UTC');

  // Threshold trigger fields
  const [metric, setMetric] = useState('cpu');
  const [operator, setOperator] = useState('>');
  const [threshold, setThreshold] = useState('80');
  const [durationMins, setDurationMins] = useState('10');

  // Actions state
  const [selectedActions, setSelectedActions] = useState([]);
  const [scaleValue, setScaleValue] = useState('2'); // scale to 2 as default

  const steps = [
    { id: 1, title: 'Select Resource Type' },
    { id: 2, title: 'Define Trigger' },
    { id: 3, title: 'Choose Actions' },
    { id: 4, title: 'Review & Create' },
  ];

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const toggleAction = (actionId) => {
    setSelectedActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
  };

  // Stubbed "AI" parse function - simulates latency and fills deterministic values based on keywords.
  const simulateAIParse = async (text) => {
    setIsParsing(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple heuristics:
        let parsedResource = 'ec2';
        if (/rds/i.test(text)) parsedResource = 'rds';
        else if (/aks|azure kubernetes/i.test(text)) parsedResource = 'aks';
        else if (/azure vm|vm\s/i.test(text)) parsedResource = 'vm';
        else if (/k8s|kubernetes/i.test(text)) parsedResource = 'k8s';

        let parsedTriggerType = /every|cron|daily|weekly|at \d|am|pm|utc/i.test(text)
          ? 'time'
          : 'threshold';

        // Time defaults
        let parsedCron = '0 8 * * *';
        let parsedTz = 'UTC';
        const timeMatch = text.match(/(\d{1,2})\s?(am|pm)/i);
        if (parsedTriggerType === 'time' && timeMatch) {
          let hour = parseInt(timeMatch[1], 10);
          const ampm = timeMatch[2].toLowerCase();
          if (ampm === 'pm' && hour < 12) hour += 12;
          if (ampm === 'am' && hour === 12) hour = 0;
          parsedCron = `0 ${hour} * * *`;
        }
        if (/pst/i.test(text)) parsedTz = 'America/Los_Angeles';
        if (/est/i.test(text)) parsedTz = 'America/New_York';

        // Threshold defaults
        let parsedMetric = /cost/i.test(text) ? 'cost' : /memory|ram/i.test(text) ? 'memory' : 'cpu';
        let parsedOperator = />=|>\s*/.test(text) ? '>' : /<=|<\s*/.test(text) ? '<' : '>';
        let parsedThreshold = /(\d{2,3})%/.test(text) ? RegExp.$1 : '80';
        let parsedDuration = /for (\d{1,3}) (min|mins|minutes)/i.test(text) ? RegExp.$1 : '10';

        // Actions
        const detectedActions = [];
        if (/start/i.test(text)) detectedActions.push('start');
        if (/stop/i.test(text)) detectedActions.push('stop');
        if (/scale/i.test(text)) detectedActions.push('scale');
        if (/delete/i.test(text)) detectedActions.push('delete');
        if (/alert|notify|email/i.test(text)) detectedActions.push('alert');
        if (detectedActions.length === 0) detectedActions.push('alert');

        // Scale amount
        let parsedScale = /scale (?:to|=)\s?(\d{1,3})/i.test(text) ? RegExp.$1 : '2';

        // Set state
        setResourceType(parsedResource);
        setTriggerType(parsedTriggerType);
        setTimeCron(parsedCron);
        setTimeTimezone(parsedTz);
        setMetric(parsedMetric);
        setOperator(parsedOperator);
        setThreshold(parsedThreshold);
        setDurationMins(parsedDuration);
        setSelectedActions(Array.from(new Set(detectedActions)));
        setScaleValue(parsedScale);

        setIsParsing(false);
        resolve(true);
      }, 700);
    });
  };

  const isStepValid = useMemo(() => {
    if (step === 1) return !!resourceType;
    if (step === 2) {
      if (triggerType === 'time') return !!timeCron && !!timeTimezone;
      if (triggerType === 'threshold')
        return !!metric && !!operator && !!threshold && !!durationMins;
      return false;
    }
    if (step === 3) return selectedActions.length > 0;
    return true;
  }, [
    step,
    resourceType,
    triggerType,
    timeCron,
    timeTimezone,
    metric,
    operator,
    threshold,
    durationMins,
    selectedActions,
  ]);

  const handleSubmit = () => {
    const payload = {
      resourceType,
      trigger: {
        type: triggerType,
        time:
          triggerType === 'time'
            ? {
                cron: timeCron,
                timezone: timeTimezone,
              }
            : null,
        threshold:
          triggerType === 'threshold'
            ? {
                metric,
                operator,
                value: Number(threshold),
                durationMins: Number(durationMins),
              }
            : null,
      },
      actions: selectedActions.map((a) =>
        a === 'scale'
          ? {
              id: a,
              params: { to: Number(scaleValue) },
            }
          : { id: a }
      ),
      createdAt: new Date().toISOString(),
    };
    if (onSubmit) onSubmit(payload);
  };

  // UI building blocks
  const Card = ({ children }) => (
    <div
      style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ children, subtitle }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: colors.text, fontWeight: 600 }}>{children}</div>
      {subtitle ? (
        <div style={{ color: colors.secondary, fontSize: 12, marginTop: 4 }}>{subtitle}</div>
      ) : null}
    </div>
  );

  const StepHeader = () => (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {steps.map((s) => {
        const isActive = s.id === step;
        return (
          <div
            key={s.id}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${isActive ? colors.primary : colors.border}`,
              color: isActive ? colors.primary : colors.secondary,
              background: isActive ? colors.surface : 'transparent',
              fontSize: 12,
            }}
          >
            {s.id}. {s.title}
          </div>
        );
      })}
    </div>
  );

  const NaturalLanguageBox = () => (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle
          subtitle="Optionally describe your automation rule; we’ll prefill the form for you."
        >
          Natural Language Input (optional)
        </SectionTitle>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: colors.secondary }}>Use AI assist</span>
          <input
            type="checkbox"
            checked={nlMode}
            onChange={(e) => setNlMode(e.target.checked)}
            aria-label="Toggle natural language mode"
          />
        </label>
      </div>
      {nlMode ? (
        <>
          <textarea
            placeholder="Describe your automation rule in plain English (e.g., 'Every day at 8am UTC, stop idle EC2 instances and send an alert')."
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 12,
              outline: 'none',
              resize: 'vertical',
              marginTop: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={async () => {
                if (!nlText.trim()) return;
                await simulateAIParse(nlText);
              }}
              disabled={!nlText.trim() || isParsing}
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: nlText.trim() && !isParsing ? 'pointer' : 'not-allowed',
                opacity: nlText.trim() && !isParsing ? 1 : 0.6,
              }}
            >
              {isParsing ? 'Parsing…' : 'Prefill with AI'}
            </button>
            <button
              onClick={() => {
                setNlText('');
              }}
              style={{
                background: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </>
      ) : (
        <div style={{ color: colors.secondary, fontSize: 12 }}>
          Toggle "Use AI assist" to describe your rule in natural language.
        </div>
      )}
    </Card>
  );

  const Step1 = () => (
    <Card>
      <SectionTitle subtitle="Choose the kind of resource this rule will manage.">
        Step 1 — Select Resource Type
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        {resourceTypes.map((rt) => {
          const isSelected = resourceType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => setResourceType(rt.id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                background: isSelected ? colors.surface : 'transparent',
                padding: 12,
                borderRadius: 8,
                color: isSelected ? colors.primary : colors.text,
                cursor: 'pointer',
              }}
            >
              {rt.label}
            </button>
          );
        })}
      </div>
    </Card>
  );

  const Step2 = () => (
    <Card>
      <SectionTitle subtitle="Pick when or under what conditions the rule should run.">
        Step 2 — Define Trigger
      </SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTriggerType('time')}
          style={{
            border: `1px solid ${triggerType === 'time' ? colors.primary : colors.border}`,
            background: triggerType === 'time' ? colors.surface : 'transparent',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            color: triggerType === 'time' ? colors.primary : colors.text,
          }}
        >
          Time
        </button>
        <button
          onClick={() => setTriggerType('threshold')}
          style={{
            border: `1px solid ${triggerType === 'threshold' ? colors.primary : colors.border}`,
            background: triggerType === 'threshold' ? colors.surface : 'transparent',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            color: triggerType === 'threshold' ? colors.primary : colors.text,
          }}
        >
          Threshold
        </button>
      </div>

      {triggerType === 'time' ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Cron Expression
            </label>
            <input
              type="text"
              value={timeCron}
              onChange={(e) => setTimeCron(e.target.value)}
              placeholder="e.g., 0 8 * * *"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: colors.secondary, marginTop: 4 }}>
              Example: "0 8 * * *" = every day at 08:00
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Timezone
            </label>
            <input
              type="text"
              value={timeTimezone}
              onChange={(e) => setTimeTimezone(e.target.value)}
              placeholder="e.g., UTC or America/Los_Angeles"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Metric
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
                background: 'white',
              }}
            >
              <option value="cpu">CPU Utilization (%)</option>
              <option value="memory">Memory Utilization (%)</option>
              <option value="cost">Cost ($)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Operator
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
                background: 'white',
              }}
            >
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g., 80"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Sustain for (mins)
            </label>
            <input
              type="number"
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              placeholder="e.g., 10"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );

  const Step3 = () => (
    <Card>
      <SectionTitle subtitle="Select one or more actions to perform when the trigger fires.">
        Step 3 — Choose Actions
      </SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actionsCatalog.map((a) => {
          const active = selectedActions.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggleAction(a.id)}
              style={{
                border: `1px solid ${active ? colors.primary : colors.border}`,
                background: active ? colors.surface : 'transparent',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                color: active ? colors.primary : colors.text,
                minWidth: 100,
                textAlign: 'center',
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {selectedActions.includes('scale') ? (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
            Scale to (count)
          </label>
          <input
            type="number"
            value={scaleValue}
            onChange={(e) => setScaleValue(e.target.value)}
            min="1"
            style={{
              width: 160,
              border: `1px solid ${colors.border}`,
              padding: '8px 10px',
              borderRadius: 8,
              outline: 'none',
            }}
          />
        </div>
      ) : null}
    </Card>
  );

  const Step4 = () => (
    <Card>
      <SectionTitle subtitle="Confirm the details below before creating your rule.">
        Step 4 — Review & Create
      </SectionTitle>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 12,
            background: colors.surface,
          }}
        >
          <div style={{ color: colors.secondary, fontSize: 12, marginBottom: 6 }}>Resource Type</div>
          <div style={{ color: colors.text, fontWeight: 600 }}>{resourceTypes.find((r) => r.id === resourceType)?.label || '-'}</div>
        </div>

        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 12,
            background: colors.surface,
          }}
        >
          <div style={{ color: colors.secondary, fontSize: 12, marginBottom: 6 }}>Trigger</div>
          {triggerType === 'time' ? (
            <div style={{ color: colors.text }}>
              <div><strong>Type:</strong> Time</div>
              <div><strong>Cron:</strong> {timeCron}</div>
              <div><strong>Timezone:</strong> {timeTimezone}</div>
            </div>
          ) : (
            <div style={{ color: colors.text }}>
              <div><strong>Type:</strong> Threshold</div>
              <div><strong>Metric:</strong> {metric}</div>
              <div><strong>Condition:</strong> {operator} {threshold}</div>
              <div><strong>Duration:</strong> {durationMins} mins</div>
            </div>
          )}
        </div>

        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 12,
            background: colors.surface,
          }}
        >
          <div style={{ color: colors.secondary, fontSize: 12, marginBottom: 6 }}>Actions</div>
          <div style={{ color: colors.text }}>
            {selectedActions.length
              ? selectedActions
                  .map((a) =>
                    a === 'scale' ? `Scale(to: ${scaleValue})` : actionsCatalog.find((x) => x.id === a)?.label || a
                  )
                  .join(', ')
              : '-'}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <StepHeader />
      <NaturalLanguageBox />
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 4,
        }}
      >
        <div style={{ color: colors.secondary, fontSize: 12 }}>
          {nlMode
            ? 'AI assist is enabled. You can edit fields after prefilling.'
            : 'You can enable AI assist to prefill fields from natural language.'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              background: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              background: 'transparent',
              color: step === 1 ? colors.secondary : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.6 : 1,
            }}
          >
            Back
          </button>
          {step < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid}
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: isStepValid ? 'pointer' : 'not-allowed',
                opacity: isStepValid ? 1 : 0.6,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                background: colors.success,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Create Rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
