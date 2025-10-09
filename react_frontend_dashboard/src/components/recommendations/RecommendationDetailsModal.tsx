import React, { useEffect, useMemo, useRef, useState } from 'react';
import { computeAdaptivePlan, type AdaptivePlan, type RecommendationLite } from '../../lib/adaptivePolicy';
import { getRecentRuns } from '../../lib/historyProvider';

type Recommendation = {
  id: string | number;
  title: string;
  cloud?: 'AWS' | 'Azure' | 'GCP' | string;
  impactedServices?: string[];
  description?: string;
  costImpactMonthly?: number; // mock-safe
  proposedActions?: string[];
  history?: Array<{ date: string; event: string }>;
  // Optional fields enabling adaptive hints
  type?: string;
  category?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  estimatedSavingsPct?: number;
  expectedSavingsPct?: number;
  requiresApproval?: boolean;
  tags?: string[];
};

type TabKey = 'overview' | 'resources' | 'cost' | 'plan' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'resources', label: 'Affected Resources' },
  { key: 'cost', label: 'Cost Impact' },
  { key: 'plan', label: 'Execution Plan' },
  { key: 'history', label: 'History' },
];

export interface RecommendationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // PUBLIC_INTERFACE
  /** Pass the exact row object from the Top Recommendations table without remapping or defaults. */
  selectedRow?: any | null;
  // PUBLIC_INTERFACE
  /** Optional run handler; when provided, enables Run optimization button. Accepts optional adaptive plan. */
  onRun?: (recommendation: any, options?: { adaptive?: AdaptivePlan }) => Promise<void> | void;
  // PUBLIC_INTERFACE
  /** Optional policy context for safety guardrails (blackout/compliance/blast radius/hours). */
  context?: {
    blackoutActive?: boolean;
    complianceFlag?: boolean;
    defaultBlastRadius?: 'canary' | 'smart-subset' | 'all';
    businessHoursLocal?: boolean;
  };
}

/**
 * PUBLIC_INTERFACE
 * RecommendationDetailsModal
 * Accessible, minimalist modal with tabbed content for recommendation details.
 * - ESC to close
 * - Focus trap while open
 * - Responsive layout
 * - Minimalist Pure White theme styles (clean whites, subtle grays, primary #374151)
 */
export const RecommendationDetailsModal: React.FC<RecommendationDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedRow,
  onRun,
  context,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Adaptive mode UI state
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(false);
  const [plan, setPlan] = useState<AdaptivePlan | null>(null);
  const [running, setRunning] = useState(false);

  // Focus management & ESC to close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Delay focus to ensure elements are rendered
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 0);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
        if (e.key === 'Tab') {
          // Focus trap
          const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;

          const focusableArray = Array.from(focusable);
          const first = focusableArray[0];
          const last = focusableArray[focusableArray.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    } else {
      // Restore focus
      previouslyFocusedElement.current?.focus();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('overview');
      setAdaptiveMode(false);
      setPlan(null);
    }
  }, [isOpen]);

  // Build lite recommendation for policy
  const recLite: RecommendationLite | null = useMemo(() => {
    const r: any = selectedRow || {};
    if (!r) return null;
    return {
      id: r.id,
      title: r.title || r.name || 'Recommendation',
      category: r.category || r.type,
      provider: r.provider || r.cloudProvider || r.cloud,
      resourceId: r.resourceId || r.resource_id,
      description: r.description,
      severity: r.severity,
      // non-strict extras used by computeAdaptivePlan
      // mapped into our RecommendationLite compatible fields
      type: r.type || r.category,
      riskLevel: r.riskLevel || 'medium',
      estimatedSavingsPct: r.estimatedSavingsPct || r.expectedSavingsPct,
      requiresApproval: !!r.requiresApproval,
      tags: r.tags || [],
    } as RecommendationLite;
  }, [selectedRow]);

  // Load adaptive plan when toggle enabled
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!adaptiveMode || !recLite) {
        if (mounted) setPlan(null);
        return;
      }
      const history = await getRecentRuns({
        recommendationId: recLite.id,
        recommendationType: recLite.type,
        limit: 25,
      });
      const computed = computeAdaptivePlan({
        recommendation: recLite,
        history,
        context: {
          blackoutActive: context?.blackoutActive,
          complianceFlag: context?.complianceFlag,
          defaultBlastRadius: context?.defaultBlastRadius,
          businessHoursLocal: context?.businessHoursLocal,
        },
      });
      if (mounted) setPlan(computed);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [
    adaptiveMode,
    recLite,
    context?.blackoutActive,
    context?.complianceFlag,
    context?.defaultBlastRadius,
    context?.businessHoursLocal,
  ]);

  if (!isOpen) return null;

  const title = (selectedRow?.title ?? selectedRow?.name) || 'Recommendation Details';
  const cloud =
    (
      selectedRow?.cloud ??
      selectedRow?.cloudProvider ??
      selectedRow?.provider ??
      (typeof selectedRow?.category === 'string' && selectedRow?.category
        ? selectedRow.category
        : undefined)
    ) || 'Multi-Cloud';
  const impacted: string[] =
    Array.isArray(selectedRow?.impactedServices)
      ? selectedRow!.impactedServices
      : Array.isArray(selectedRow?.services)
      ? selectedRow!.services
      : [];
  const cost =
    typeof selectedRow?.costImpactMonthly === 'number'
      ? selectedRow.costImpactMonthly
      : (typeof selectedRow?.estimated_savings === 'number'
          ? selectedRow.estimated_savings
          : undefined);
  const actions: string[] =
    Array.isArray(selectedRow?.proposedActions) && selectedRow!.proposedActions.length > 0
      ? selectedRow!.proposedActions
      : [];
  const history = Array.isArray(selectedRow?.history) && selectedRow!.history.length > 0 ? selectedRow!.history : [];

  const confidencePct = Math.round((plan?.confidence ?? 0) * 100);

  const handleRun = async () => {
    if (!onRun) return;
    setRunning(true);
    try {
      if (adaptiveMode && plan) {
        await onRun(selectedRow, { adaptive: plan });
      } else {
        await onRun(selectedRow);
      }
      onClose();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      aria-hidden={!isOpen}
      aria-modal="true"
      role="dialog"
      aria-labelledby="rec-modal-title"
      className="rcm-overlay"
      style={styles.overlay}
      onClick={(e) => {
        // Close only if clicking the overlay, not inside the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div ref={modalRef} className="rcm-modal" style={styles.modal}>
        <div style={styles.header}>
          <h2 id="rec-modal-title" style={styles.title}>
            {title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Adaptive toggle only affects Run behavior; does not add extra external buttons */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(e) => setAdaptiveMode(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>Adaptive mode</span>
            </label>
            <button onClick={onClose} aria-label="Close" style={styles.closeButton}>
              ×
            </button>
          </div>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaChip}>Cloud: {cloud}</span>
          <span style={styles.metaChip}>Services: {impacted.join(', ') || '—'}</span>
        </div>

        {adaptiveMode && (
          <div style={styles.adaptiveBox} aria-live="polite">
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                  Confidence: <strong>{confidencePct}%</strong>
                </div>
                <div style={styles.meterTrack}>
                  <div
                    style={{
                      width: `${confidencePct}%`,
                      height: '100%',
                      background: meterColor(plan?.confidence ?? 0),
                      transition: 'width 0.3s ease',
                    }}
                    aria-label="confidence-meter"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={`Aggressiveness: ${plan?.aggressiveness ?? '—'}`} />
                <Badge label={`Scope: ${plan?.scope ?? '—'}`} />
                <Badge label={`Schedule: ${plan?.scheduleHint ?? '—'}`} />
                {plan?.safeguards?.requireApproval ? (
                  <Badge label="Approval required" tone="warning" />
                ) : (
                  <Badge label="Approval not required" tone="neutral" />
                )}
                {plan?.safeguards?.capScopeToCanary && <Badge label="Scope capped to canary" tone="warning" />}
                {plan?.safeguards?.respectBlackout && <Badge label="Blackout active" tone="danger" />}
              </div>

              <div style={{ fontSize: 13, color: '#374151' }}>
                Expected improvement:{' '}
                {plan ? `${Math.round(plan.expectedSavingsDelta.minPct)}–${Math.round(plan.expectedSavingsDelta.maxPct)}%` : '—'}
              </div>

              <div style={styles.rationaleBox}>
                {plan?.rationale || 'Rationale will appear when Adaptive mode is enabled.'}
              </div>
            </div>
          </div>
        )}

        <div style={styles.tabsContainer}>
          <div role="tablist" aria-label="Recommendation detail tabs" style={styles.tablist}>
            {TABS.map((t) => {
              const selected = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${t.key}`}
                  id={`tab-${t.key}`}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    ...styles.tab,
                    ...(selected ? styles.tabActive : {}),
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div style={styles.tabPanels}>
            {activeTab === 'overview' && (
              <section role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" style={styles.panel}>
                <p style={styles.paragraph}>
                  {selectedRow?.description ||
                    'This recommendation aims to optimize resource usage and reduce costs across your selected cloud environments. Review the impact and proposed actions before executing.'}
                </p>
                <ul style={styles.list}>
                  {selectedRow?.severity != null && <li>Severity: {String(selectedRow.severity)}</li>}
                  {selectedRow?.priority != null && <li>Priority: {String(selectedRow.priority)}</li>}
                  {selectedRow?.category != null && <li>Category: {String(selectedRow.category)}</li>}
                  {typeof cost === 'number' && <li>Est. Monthly Savings: ${Number(cost).toFixed(2)}</li>}
                </ul>
              </section>
            )}
            {activeTab === 'resources' && (
              <section role="tabpanel" id="panel-resources" aria-labelledby="tab-resources" style={styles.panel}>
                <p style={styles.paragraph}>Affected resources include entries from the impacted services:</p>
                <ul style={styles.list}>
                  {impacted.length > 0 ? impacted.map((svc, idx) => <li key={idx}>{svc}</li>) : <li>None listed</li>}
                </ul>
              </section>
            )}
            {activeTab === 'cost' && (
              <section role="tabpanel" id="panel-cost" aria-labelledby="tab-cost" style={styles.panel}>
                {typeof cost === 'number' ? (
                  <p style={styles.paragraph}>
                    Estimated monthly cost impact (savings): <strong>${Number(cost).toFixed(2)}</strong>
                  </p>
                ) : (
                  <p style={styles.paragraph}>No cost estimate provided.</p>
                )}
                <p style={styles.paragraphSecondary}>
                  Cost impact is calculated using conservative assumptions and does not reflect real billing data.
                </p>
              </section>
            )}
            {activeTab === 'plan' && (
              <section role="tabpanel" id="panel-plan" aria-labelledby="tab-plan" style={styles.panel}>
                <p style={styles.paragraph}>Proposed execution steps:</p>
                <ol style={styles.orderedList}>{actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
                <p style={styles.paragraphSecondary}>Validate each step in a non-production environment prior to rollout.</p>
              </section>
            )}
            {activeTab === 'history' && (
              <section role="tabpanel" id="panel-history" aria-labelledby="tab-history" style={styles.panel}>
                <ul style={styles.timeline}>
                  {history.map((h, i) => (
                    <li key={i} style={styles.timelineItem}>
                      <span style={styles.timelineDate}>{h.date}</span>
                      <span>{h.event}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid #F3F4F6' }}>
          <button className="btn-secondary" onClick={onClose} disabled={running}>
            Cancel
          </button>
          {typeof onRun === 'function' && (
            <button className="btn-primary" onClick={handleRun} disabled={running}>
              {running ? 'Running...' : 'Run optimization'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Minimalist Pure White theme styles
const styles: { [k: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.35)', // subtle dark overlay
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
    borderRadius: 12,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 920,
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #E5E7EB',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 12px 12px 20px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    flex: 1,
  },
  closeButton: {
    appearance: 'none',
    border: 'none',
    background: '#F3F4F6',
    borderRadius: 8,
    width: 36,
    height: 36,
    color: '#374151',
    fontSize: 22,
    cursor: 'pointer',
    lineHeight: 1,
  },
  metaRow: {
    display: 'flex',
    gap: 8,
    padding: '8px 20px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#F9FAFB',
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: 12,
    color: '#374151',
    background: '#F3F4F6',
    padding: '6px 10px',
    borderRadius: 999,
  },
  adaptiveBox: {
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 12,
    background: '#FFFFFF',
    margin: '12px 16px',
  },
  meterTrack: {
    height: 8,
    width: '100%',
    background: '#F3F4F6',
    borderRadius: 999,
    overflow: 'hidden',
  },
  tabsContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tablist: {
    display: 'flex',
    gap: 8,
    padding: '12px 12px 0 12px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    overflowX: 'auto',
  },
  tab: {
    appearance: 'none',
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 10,
    color: '#374151',
    cursor: 'pointer',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: '#F3F4F6',
    color: '#111827',
    fontWeight: 600,
  },
  tabPanels: {
    padding: 16,
    overflowY: 'auto',
    background: '#FFFFFF',
  },
  panel: {
    display: 'block',
  },
  paragraph: {
    margin: '0 0 8px 0',
    color: '#111827',
    lineHeight: 1.6,
  },
  paragraphSecondary: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  list: {
    paddingLeft: 18,
    margin: '8px 0 0 0',
  },
  orderedList: {
    paddingLeft: 18,
    margin: '8px 0',
  },
  timeline: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  timelineItem: {
    display: 'flex',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  timelineDate: {
    color: '#9CA3AF',
    fontSize: 12,
    minWidth: 90,
  },
};

function meterColor(conf: number) {
  if (conf >= 0.8) return '#10B981'; // success
  if (conf >= 0.6) return '#6EE7B7';
  if (conf >= 0.4) return '#F59E0B'; // amber
  return '#EF4444';
}

function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warning' | 'danger' }) {
  const stylesLocal: Record<string, { bg: string; color: string; b: string }> = {
    neutral: { bg: '#F3F4F6', color: '#374151', b: '#E5E7EB' },
    warning: { bg: '#FEF3C7', color: '#92400E', b: '#FDE68A' },
    danger: { bg: '#FEE2E2', color: '#991B1B', b: '#FCA5A5' },
  };
  const st = stylesLocal[tone];
  return (
    <span
      style={{
        background: st.bg,
        color: st.color,
        border: `1px solid ${st.b}`,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        lineHeight: '18px',
      }}
    >
      {label}
    </span>
  );
}

export default RecommendationDetailsModal;
