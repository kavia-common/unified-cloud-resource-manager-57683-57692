import React, { useEffect, useRef, useState } from 'react';

type Recommendation = {
  id: string | number;
  title: string;
  cloud?: 'AWS' | 'Azure' | 'GCP' | string;
  impactedServices?: string[];
  description?: string;
  costImpactMonthly?: number; // mock-safe
  proposedActions?: string[];
  history?: Array<{ date: string; event: string }>;
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
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

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
    }
  }, [isOpen]);

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
  const history =
    Array.isArray(selectedRow?.history) && selectedRow!.history.length > 0
      ? selectedRow!.history
      : [];

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
      <div
        ref={modalRef}
        className="rcm-modal"
        style={styles.modal}
      >
        <div style={styles.header}>
          <h2 id="rec-modal-title" style={styles.title}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaChip}>
            Cloud: {cloud}
          </span>
          <span style={styles.metaChip}>
            Services: {impacted.join(', ')}
          </span>
        </div>

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
              <section
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                style={styles.panel}
              >
                <p style={styles.paragraph}>
                  {selectedRow?.description ||
                    'This recommendation aims to optimize resource usage and reduce costs across your selected cloud environments. Review the impact and proposed actions before executing.'}
                </p>
                <ul style={styles.list}>
                  {selectedRow?.severity != null && (
                    <li>Severity: {String(selectedRow.severity)}</li>
                  )}
                  {selectedRow?.priority != null && (
                    <li>Priority: {String(selectedRow.priority)}</li>
                  )}
                  {selectedRow?.category != null && (
                    <li>Category: {String(selectedRow.category)}</li>
                  )}
                  {typeof cost === 'number' && (
                    <li>Est. Monthly Savings: ${Number(cost).toFixed(2)}</li>
                  )}
                </ul>
              </section>
            )}
            {activeTab === 'resources' && (
              <section
                role="tabpanel"
                id="panel-resources"
                aria-labelledby="tab-resources"
                style={styles.panel}
              >
                <p style={styles.paragraph}>
                  Affected resources include entries from the impacted services:
                </p>
                <ul style={styles.list}>
                  {impacted.length > 0 ? impacted.map((svc, idx) => (
                    <li key={idx}>{svc}</li>
                  )) : <li>None listed</li>}
                </ul>
              </section>
            )}
            {activeTab === 'cost' && (
              <section
                role="tabpanel"
                id="panel-cost"
                aria-labelledby="tab-cost"
                style={styles.panel}
              >
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
              <section
                role="tabpanel"
                id="panel-plan"
                aria-labelledby="tab-plan"
                style={styles.panel}
              >
                <p style={styles.paragraph}>Proposed execution steps:</p>
                <ol style={styles.orderedList}>
                  {actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
                <p style={styles.paragraphSecondary}>
                  Validate each step in a non-production environment prior to rollout.
                </p>
              </section>
            )}
            {activeTab === 'history' && (
              <section
                role="tabpanel"
                id="panel-history"
                aria-labelledby="tab-history"
                style={styles.panel}
              >
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
    boxShadow:
      '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 840,
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #E5E7EB',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
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

export default RecommendationDetailsModal;
