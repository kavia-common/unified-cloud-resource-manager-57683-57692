import React, { useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * AutomationWizard
 * Guided, instructional setup flow to create automation rules step-by-step:
 *  1) Select resource type (with examples)
 *  2) Define trigger (time or threshold) with helper hints and validation
 *  3) Choose actions (with contextual help and parameters)
 *  4) Review & confirm (with final confirmation checkbox)
 *
 * This component uses mock data and a stubbed AI handler for natural language prefill.
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
    info: '#2563EB',
    warning: '#F59E0B',
  };

  // Mocked data
  const resourceTypes = useMemo(
    () => [
      { id: 'ec2', label: 'AWS EC2 Instance', hint: 'Compute instances. Common for start/stop schedules.' },
      { id: 'rds', label: 'AWS RDS Database', hint: 'Managed databases. Useful for off-hours stop and cost caps.' },
      { id: 'aks', label: 'Azure AKS Cluster', hint: 'Kubernetes clusters. Scale node pools based on workload.' },
      { id: 'vm', label: 'Azure VM', hint: 'Virtual machines. Start/stop on a schedule to save costs.' },
      { id: 'k8s', label: 'Kubernetes Deployment', hint: 'Workload deployments. Scale replicas with thresholds.' },
    ],
    []
  );

  const actionsCatalog = useMemo(
    () => [
      { id: 'start', label: 'Start', help: 'Start the resource if stopped.' },
      { id: 'stop', label: 'Stop', help: 'Stop the resource to save cost.' },
      { id: 'scale', label: 'Scale', help: 'Adjust capacity (e.g., replica count).' },
      { id: 'delete', label: 'Delete', help: 'Permanently remove. Use with caution.' },
      { id: 'alert', label: 'Send Alert', help: 'Notify via email/Slack (mock).' },
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

  // Guided extras
  const [touched, setTouched] = useState({});
  const [confirmChecked, setConfirmChecked] = useState(false);

  const steps = [
    { id: 1, title: 'Select Resource Type', desc: 'Choose the resource family your rule should target.' },
    { id: 2, title: 'Define Trigger', desc: 'Specify when or under what conditions the rule runs.' },
    { id: 3, title: 'Choose Actions', desc: 'Select actions to perform when the trigger fires.' },
    { id: 4, title: 'Review & Confirm', desc: 'Verify details and confirm creation.' },
  ];

  const totalSteps = steps.length;
  const progressPct = Math.round((step / totalSteps) * 100);

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

  // Validation & inline messages
  const errors = {
    resourceType: !resourceType && touched.resourceType ? 'Please select a resource type.' : '',
    timeCron:
      step === 2 && triggerType === 'time' && touched.timeCron && !timeCron
        ? 'Cron expression is required.'
        : '',
    timeTimezone:
      step === 2 && triggerType === 'time' && touched.timeTimezone && !timeTimezone
        ? 'Timezone is required.'
        : '',
    metric:
      step === 2 && triggerType === 'threshold' && touched.metric && !metric ? 'Metric is required.' : '',
    operator:
      step === 2 && triggerType === 'threshold' && touched.operator && !operator
        ? 'Operator is required.'
        : '',
    threshold:
      step === 2 && triggerType === 'threshold' && touched.threshold && !threshold
        ? 'Threshold is required.'
        : '',
    durationMins:
      step === 2 && triggerType === 'threshold' && touched.durationMins && !durationMins
        ? 'Duration (mins) is required.'
        : '',
    actions:
      step === 3 && touched.actions && selectedActions.length === 0
        ? 'Select at least one action.'
        : '',
    confirm: step === 4 && touched.confirm && !confirmChecked ? 'Please confirm to proceed.' : '',
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
    if (step === 4) return confirmChecked;
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
    confirmChecked,
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

  const Hint = ({ children }) => (
    <div
      style={{
        marginTop: 6,
        color: colors.secondary,
        fontSize: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          lineHeight: '16px',
          textAlign: 'center',
          borderRadius: '50%',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.secondary,
          fontSize: 11,
        }}
      >
        i
      </span>
      <span>{children}</span>
    </div>
  );

  const ErrorText = ({ children }) => (
    <div style={{ color: colors.error, fontSize: 12, marginTop: 6 }}>{children}</div>
  );

  const StepHeader = () => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
              aria-current={isActive ? 'step' : undefined}
            >
              {s.id}. {s.title}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 10, height: 6, background: colors.surface, borderRadius: 999 }}>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          style={{
            height: 6,
            width: `${progressPct}%`,
            background: colors.primary,
            borderRadius: 999,
            transition: 'width 200ms ease',
          }}
        />
      </div>

      {/* Step description */}
      <div style={{ marginTop: 8, color: colors.secondary, fontSize: 12 }}>
        {steps.find((s) => s.id === step)?.desc}
      </div>
    </div>
  );

  const NaturalLanguageBox = () => (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle subtitle="Optionally describe your rule; we’ll prefill the form for you.">
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
            placeholder="e.g., “Every weekday at 7pm PST, stop idle Azure VMs and send an alert.”"
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
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
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

            {/* Example quick-picks */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                'Every day at 8am UTC, stop EC2 instances and send alert',
                'If CPU > 85% for 15 minutes, scale to 3 and alert',
                'Every weekday at 7pm PST, stop Azure VMs',
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setNlText(ex)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.text,
                    borderRadius: 999,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  aria-label={`Use example: ${ex}`}
                  title="Insert example text"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
          </div>
          <Hint>Tip: Mention resource, timing/condition, and actions. We’ll try to prefill accordingly.</Hint>
        </>
      ) : (
        <div style={{ color: colors.secondary, fontSize: 12 }}>
          Toggle “Use AI assist” to describe your rule in natural language.
        </div>
      )}
    </Card>
  );

  const Step1 = () => (
    <Card>
      <SectionTitle subtitle="Choose the kind of resource this rule will manage.">
        Step 1 — Select Resource Type
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        {resourceTypes.map((rt) => {
          const isSelected = resourceType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => {
                setResourceType(rt.id);
                setTouched((t) => ({ ...t, resourceType: true }));
              }}
              style={{
                textAlign: 'left',
                border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                background: isSelected ? colors.surface : 'transparent',
                padding: 12,
                borderRadius: 8,
                color: isSelected ? colors.primary : colors.text,
                cursor: 'pointer',
              }}
              title={rt.hint}
            >
              <div style={{ fontWeight: 600 }}>{rt.label}</div>
              <div style={{ color: colors.secondary, fontSize: 12, marginTop: 4 }}>{rt.hint}</div>
            </button>
          );
        })}
      </div>
      {errors.resourceType && <ErrorText>{errors.resourceType}</ErrorText>}
      <Hint>Popular: EC2 and Azure VMs for off-hours stop/start schedules to reduce costs.</Hint>
    </Card>
  );

  const Step2 = () => (
    <Card>
      <SectionTitle subtitle="Pick when or under what conditions the rule should run.">
        Step 2 — Define Trigger
      </SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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
          aria-pressed={triggerType === 'time'}
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
          aria-pressed={triggerType === 'threshold'}
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
              onBlur={() => setTouched((t) => ({ ...t, timeCron: true }))}
              placeholder="e.g., 0 8 * * *"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
              aria-invalid={!!errors.timeCron}
            />
            <div style={{ fontSize: 11, color: colors.secondary, marginTop: 4 }}>
              Example: “0 8 * * *” = every day at 08:00
            </div>
            {errors.timeCron && <ErrorText>{errors.timeCron}</ErrorText>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Timezone
            </label>
            <input
              type="text"
              value={timeTimezone}
              onChange={(e) => setTimeTimezone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, timeTimezone: true }))}
              placeholder="e.g., UTC or America/Los_Angeles"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
              aria-invalid={!!errors.timeTimezone}
            />
            {errors.timeTimezone && <ErrorText>{errors.timeTimezone}</ErrorText>}
          </div>
          <Hint>
            Need help with cron? Common patterns: “0 8 * * *” daily 8am, “0 */2 * * *” every 2 hours.
          </Hint>
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
              onBlur={() => setTouched((t) => ({ ...t, metric: true }))}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
                background: 'white',
              }}
              aria-invalid={!!errors.metric}
            >
              <option value="cpu">CPU Utilization (%)</option>
              <option value="memory">Memory Utilization (%)</option>
              <option value="cost">Cost ($)</option>
            </select>
            {errors.metric && <ErrorText>{errors.metric}</ErrorText>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Operator
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, operator: true }))}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
                background: 'white',
              }}
              aria-invalid={!!errors.operator}
            >
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
            </select>
            {errors.operator && <ErrorText>{errors.operator}</ErrorText>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, threshold: true }))}
              placeholder="e.g., 80"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
              aria-invalid={!!errors.threshold}
            />
            {errors.threshold && <ErrorText>{errors.threshold}</ErrorText>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: colors.secondary, marginBottom: 6 }}>
              Sustain for (mins)
            </label>
            <input
              type="number"
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, durationMins: true }))}
              placeholder="e.g., 10"
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                padding: '8px 10px',
                borderRadius: 8,
                outline: 'none',
              }}
              aria-invalid={!!errors.durationMins}
            />
            {errors.durationMins && <ErrorText>{errors.durationMins}</ErrorText>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Hint>
              Example: “When CPU &gt; 85% for 15 minutes, scale replicas to 3 and alert.”
            </Hint>
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
              onClick={() => {
                toggleAction(a.id);
                setTouched((t) => ({ ...t, actions: true }));
              }}
              style={{
                border: `1px solid ${active ? colors.primary : colors.border}`,
                background: active ? colors.surface : 'transparent',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                color: active ? colors.primary : colors.text,
                minWidth: 120,
                textAlign: 'left',
              }}
              title={a.help}
            >
              <div style={{ fontWeight: 600 }}>{a.label}</div>
              <div style={{ color: colors.secondary, fontSize: 12, marginTop: 4 }}>{a.help}</div>
            </button>
          );
        })}
      </div>
      {errors.actions && <ErrorText>{errors.actions}</ErrorText>}

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
              width: 180,
              border: `1px solid ${colors.border}`,
              padding: '8px 10px',
              borderRadius: 8,
              outline: 'none',
            }}
          />
          <Hint>Set the desired capacity (e.g., replicas or instance count).</Hint>
        </div>
      ) : null}
    </Card>
  );

  const Step4 = () => (
    <Card>
      <SectionTitle subtitle="Confirm the details below, then acknowledge to create your rule.">
        Step 4 — Review & Confirm
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
          <div style={{ color: colors.text, fontWeight: 600 }}>
            {resourceTypes.find((r) => r.id === resourceType)?.label || '-'}
          </div>
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
                    a === 'scale'
                      ? `Scale(to: ${scaleValue})`
                      : actionsCatalog.find((x) => x.id === a)?.label || a
                  )
                  .join(', ')
              : '-'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => {
              setConfirmChecked(e.target.checked);
              setTouched((t) => ({ ...t, confirm: true }));
            }}
          />
          <span>I’ve reviewed the configuration and want to create this rule.</span>
        </label>
        {errors.confirm && <ErrorText>{errors.confirm}</ErrorText>}
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            onClick={() => {
              if (step === 1) setTouched((t) => ({ ...t, resourceType: true }));
              if (step === 2) {
                if (triggerType === 'time') {
                  setTouched((t) => ({ ...t, timeCron: true, timeTimezone: true }));
                } else {
                  setTouched((t) => ({
                    ...t,
                    metric: true,
                    operator: true,
                    threshold: true,
                    durationMins: true,
                  }));
                }
              }
              if (step === 3) setTouched((t) => ({ ...t, actions: true }));
              if (step === 4) setTouched((t) => ({ ...t, confirm: true }));
              handleBack();
            }}
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
              onClick={() => {
                if (step === 1) setTouched((t) => ({ ...t, resourceType: true }));
                if (step === 2) {
                  if (triggerType === 'time') {
                    setTouched((t) => ({ ...t, timeCron: true, timeTimezone: true }));
                  } else {
                    setTouched((t) => ({
                      ...t,
                      metric: true,
                      operator: true,
                      threshold: true,
                      durationMins: true,
                    }));
                  }
                }
                if (step === 3) setTouched((t) => ({ ...t, actions: true }));
                handleNext();
              }}
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
              disabled={!isStepValid}
              style={{
                background: colors.success,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: isStepValid ? 'pointer' : 'not-allowed',
                opacity: isStepValid ? 1 : 0.6,
              }}
              title={!confirmChecked ? 'Please confirm before creating.' : 'Create rule'}
            >
              Create Rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
