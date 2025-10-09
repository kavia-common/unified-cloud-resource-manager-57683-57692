import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRecommendations,
  formatCurrency,
  formatRelativeTime,
  selectTopHighPriorityRecommendations,
} from '../../services/recommendations';
import { getTop3HighPriorityFromFake } from '../../services/recommendationsFake';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Dark theme tokens scoped to this component only.
 * We avoid global CSS changes by using inline styles and a wrapper className hook.
 */
const TOKENS = {
  bg: '#111827', // background for header row and hover
  surface: '#1F2937', // container and row surface
  border: '#374151',
  text: '#F3F4F6',
  textSecondary: '#D1D5DB',
  subtle: '#9CA3AF',

  criticalBg: '#7F1D1D',
  criticalText: '#FEE2E2',
  highBg: '#92400E',
  highText: '#FFEDD5',

  savingsBg: '#065F46',
  savingsText: '#D1FAE5',

  primaryOutline: '#4B5563',
  linkDefault: '#D1D5DB',
  linkHover: '#93C5FD',

  focusRing: '#60A5FA',
  hoverAccent: 'rgba(255,255,255,0.06)',
};

function focusableBase(): React.CSSProperties {
  return {
    outline: 'none',
  };
}

function focusRingStyles(): React.CSSProperties {
  return {
    boxShadow: `0 0 0 2px ${TOKENS.focusRing}`,
  };
}

function rowGridBase(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.7fr 0.6fr 0.8fr',
    gap: 12,
  };
}

function titleCellMeta(): React.CSSProperties {
  return { color: TOKENS.subtle, fontSize: 12, marginTop: 2 };
}

function headerText(): React.CSSProperties {
  return {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  };
}

function buttonBase(): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  };
}

function listRowBase(): React.CSSProperties {
  return {
    ...rowGridBase(),
    padding: '14px 8px',
    alignItems: 'center',
    borderBottom: `1px solid ${TOKENS.border}`,
    background: TOKENS.surface,
  };
}

function SkeletonRow() {
  // Dark skeleton shimmer with accessible contrast
  return (
    <div
      style={{
        ...rowGridBase(),
        padding: '12px 8px',
        alignItems: 'center',
        borderBottom: `1px solid ${TOKENS.border}`,
        background: TOKENS.surface,
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            background:
              'linear-gradient(90deg, rgba(55,65,81,0.6) 25%, rgba(75,85,99,0.6) 37%, rgba(55,65,81,0.6) 63%)',
            borderRadius: 6,
            animation: 'shine 1.2s infinite linear',
          }}
        />
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  // Map severities to dark badges
  let bg = TOKENS.highBg;
  let text = TOKENS.highText;
  if (severity === 'Critical') {
    bg = TOKENS.criticalBg;
    text = TOKENS.criticalText;
  } else if (severity === 'High') {
    bg = TOKENS.highBg;
    text = TOKENS.highText;
  } else {
    // default subtle for others
    bg = '#374151';
    text = TOKENS.textSecondary;
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${TOKENS.border}`,
      }}
      aria-label={`Severity ${severity}`}
    >
      {severity}
    </span>
  );
}

function SavingsPill({ value }: { value: number | null | undefined }) {
  const label = formatCurrency(value ?? 0);
  return (
    <span
      style={{
        color: TOKENS.savingsText,
        backgroundColor: TOKENS.savingsBg,
        border: `1px solid rgba(16,185,129,0.35)`,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
      }}
      aria-label={`Estimated savings ${label}`}
    >
      {label}
    </span>
  );
}

/**
 * PUBLIC_INTERFACE
 * TopRecommendations
 * Renders the top 3 high-priority recommendations with robust handling to avoid flicker/empty state
 * due to double mounts (React StrictMode) or stale requests. Ensures the latest successful fetch
 * updates state and preserves previously shown items if a subsequent fetch returns empty.
 *
 * Data sourcing note:
 * - This component currently prioritizes fake data from the AI Recommendations page to reliably
 *   populate the Top 3 items in the dashboard (dev mode). It will switch to Supabase-first when
 *   real data is available. Supabase remains as a fallback for now.
 *
 * Props:
 *  - none
 *
 * Behavior:
 *  - Uses a request-id guard so only the latest fetch updates state.
 *  - Logs dev-only which source filled the table: "TopRecs source: fake-data" | "TopRecs source: supabase".
 *  - Will not clear previously shown items if subsequent fetch filters to zero while raw > 0.
 */
// PUBLIC_INTERFACE
/** PUBLIC_INTERFACE
 * TopRecommendations props for optional external details handler.
 */
type TopRecommendationsProps = {
  // PUBLIC_INTERFACE
  onViewDetails?: (rec: any) => void;
};

// PUBLIC_INTERFACE
export function TopRecommendations({ onViewDetails }: TopRecommendationsProps) {
  const navigate = useNavigate();
  // Use a structural type here to avoid hard dependency on RankedRecommendation interface
  const [items, setItems] = useState<any[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Guard against StrictMode double-invoke and stale async results
  const reqIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const myId = ++reqIdRef.current;

    async function load() {
      setState('loading');
      setError(null);
      try {
        // 1) Try fake-data selector first
        const fake = getTop3HighPriorityFromFake();
        if (Array.isArray(fake) && fake.length === 3) {
          if (!mounted || myId !== reqIdRef.current) return;
          if (process.env.NODE_ENV !== 'test') {
            console.debug('TopRecs source: fake-data');
          }
          setItems(fake);
          setFetchedCount(fake.length);
          setFilteredCount(fake.length);
          setState('success');
          // Do NOT attempt Supabase path if fake-data fulfilled the requirement
          return;
        }

        // 2) Fallback to Supabase path using robust selector
        const raw = await getRecommendations();
        const ranked = selectTopHighPriorityRecommendations(raw, 3);

        if (!mounted || myId !== reqIdRef.current) return;

        if (process.env.NODE_ENV !== 'test') {
          console.debug('TopRecs source: supabase');
          console.debug(`[TopRecs] UI received raw=${raw.length}, ranked=${ranked.length}`);
          if (raw.length > 0 && ranked.length === 0) {
            console.debug('[TopRecs] Example raw item (first):', raw[0]);
          }
        }

        setFetchedCount(raw.length);
        setFilteredCount(ranked.length);

        if (ranked.length === 0 && raw.length > 0 && items.length > 0) {
          console.warn(`[TopRecs] Filtered to 0; preserving previous items. fetched=${raw.length}`);
          setState('success');
          return;
        }

        setItems(ranked);
        setState('success');

        if (ranked.length === 0 && raw.length > 0) {
          console.warn(
            `[TopRecs] Showing empty state after filtering. fetched=${raw.length} filtered=0`
          );
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('TopRecommendations fetch failed:', e?.message || e);
        if (mounted && myId === reqIdRef.current) {
          setError('Unable to load recommendations.');
          setState('error');
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [items.length]); // re-run if items.length changes since we use it in conditional logic

  const content = useMemo(() => {
    if (state === 'loading') {
      return (
        <div role="status" aria-live="polite" aria-busy="true">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div
          style={{
            color: TOKENS.criticalText,
            backgroundColor: 'rgba(127,29,29,0.15)',
            border: `1px solid ${TOKENS.border}`,
            padding: 12,
            borderRadius: 8,
          }}
          role="alert"
        >
          {error || 'Failed to load recommendations.'}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              color: TOKENS.subtle,
              backgroundColor: TOKENS.surface,
              border: `1px dashed ${TOKENS.border}`,
              padding: 16,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            No high-priority recommendations right now
          </div>
          {fetchedCount > 0 && (
            <div style={{ color: TOKENS.subtle, fontSize: 12, textAlign: 'center' }}>
              Note: {fetchedCount} items exist but none met relaxed high-priority and confidence thresholds.
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        role="table"
        aria-label="Top Recommendations table"
        style={{
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          background: TOKENS.surface,
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        <div
          role="row"
          style={{
            ...rowGridBase(),
            padding: '12px 8px',
            background: TOKENS.bg,
            borderBottom: `1px solid ${TOKENS.border}`,
            ...headerText(),
          }}
        >
          <div role="columnheader">Title</div>
          <div role="columnheader">Severity</div>
          <div role="columnheader">Risk</div>
          <div role="columnheader">Est. Savings</div>
          <div role="columnheader">Updated</div>
          <div role="columnheader">Action</div>
        </div>
        {items.slice(0, 3).map((rec) => (
          <div
            key={rec.id}
            role="row"
            style={listRowBase()}
            onMouseEnter={(e) => {
              (e.currentTarget.style.backgroundColor as any) = TOKENS.bg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.backgroundColor as any) = TOKENS.surface;
            }}
          >
            <div role="cell" style={{ color: TOKENS.text, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor:
                      (rec.environment || '').toLowerCase() === 'prod' ? TOKENS.criticalBg : '#2563EB',
                  }}
                  aria-hidden
                  title={rec.environment ? `Env: ${rec.environment}` : 'Env'}
                />
                <span>{(rec as any).title || (rec as any).name || 'Recommendation'}</span>
              </div>
              <div style={titleCellMeta()}>
                {(rec as any).category || (rec as any).type || rec.environment || '\u2014'}
              </div>
            </div>
            <div role="cell">
              <SeverityBadge severity={(rec as any).severity || (rec as any).priority || 'High'} />
            </div>
            <div role="cell" style={{ color: TOKENS.text }}>
              {Math.round((rec as any).risk_score ?? (rec as any).risk ?? 0)}
            </div>
            <div role="cell">
              <SavingsPill value={(rec as any).estimated_savings ?? (rec as any).savings ?? 0} />
            </div>
            <div role="cell" style={{ color: TOKENS.subtle }}>
              {formatRelativeTime((rec as any).updated_at || (rec as any).last_seen || (rec as any).detected_at)}
            </div>
            <div role="cell" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                aria-label={`Fix recommendation ${(rec as any).title || (rec as any).name || 'item'}`}
                onClick={() => {
                  navigate('/recommendations');
                }}
                style={{
                  ...buttonBase(),
                  backgroundColor: 'transparent',
                  border: `1px solid ${TOKENS.primaryOutline}`,
                  color: '#E5E7EB',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.backgroundColor as any) = TOKENS.hoverAccent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.backgroundColor as any) = 'transparent';
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, focusRingStyles())}
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                Fix now
              </button>
              <button
                aria-label={`View details for ${(rec as any).title || (rec as any).name || 'item'}`}
                onClick={() => {
                  if (typeof onViewDetails === 'function') {
                    onViewDetails(rec);
                  } else {
                    // eslint-disable-next-line no-console
                    console.debug('[TopRecs] View details clicked (no handler provided):', rec?.id);
                  }
                }}
                style={{
                  ...buttonBase(),
                  backgroundColor: 'transparent',
                  border: `1px solid ${TOKENS.border}`,
                  color: TOKENS.linkDefault,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.color as any) = TOKENS.linkHover;
                  (e.currentTarget.style.backgroundColor as any) = TOKENS.hoverAccent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.color as any) = TOKENS.linkDefault;
                  (e.currentTarget.style.backgroundColor as any) = 'transparent';
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, focusRingStyles())}
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                View details
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  aria-label="More actions"
                  onClick={(e) => {
                    // TODO: Replace with real popover/menu
                    // eslint-disable-next-line no-alert
                    window.alert('Actions: Snooze, Dismiss (stub)');
                    e.stopPropagation();
                  }}
                  style={{
                    ...buttonBase(),
                    width: 32,
                    height: 32,
                    backgroundColor: 'transparent',
                    color: TOKENS.subtle,
                    border: `1px solid ${TOKENS.border}`,
                  }}
                  title="More"
                  onMouseEnter={(e) => {
                    (e.currentTarget.style.backgroundColor as any) = TOKENS.hoverAccent;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget.style.backgroundColor as any) = 'transparent';
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, focusRingStyles())}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  \u22ef
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [state, error, items, navigate]);

  return (
    <section
      className="toprecs-dark"
      aria-labelledby="top-recommendations-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'transparent',
      }}
    >
      <div
        id="top-recommendations-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: TOKENS.surface,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            color: TOKENS.text,
            fontWeight: 700,
          }}
        >
          Top Recommendations
        </h2>
        <span style={{ color: TOKENS.textSecondary, fontSize: 12 }}>
          Top 3 high-priority with confidence \u2265 0.5
        </span>
      </div>
      {content}
    </section>
  );
}
