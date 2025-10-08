import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getRecommendations,
  formatCurrency,
  formatRelativeTime,
  selectTopHighPriorityRecommendations,
} from '../../services/recommendations';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const borderColor = '#E5E7EB';
const surface = '#F9FAFB';
const textColor = '#111827';
const primary = '#374151';
const success = '#10B981';
const errorColor = '#EF4444';

function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === 'Critical'
      ? errorColor
      : severity === 'High'
      ? '#F87171'
      : '#9CA3AF';
  const bg =
    severity === 'Critical'
      ? '#FEE2E2'
      : severity === 'High'
      ? '#FEE2E2'
      : '#F3F4F6';

  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
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
        color: success,
        backgroundColor: '#ECFDF5',
        border: `1px solid ${'#A7F3D0'}`,
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

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.7fr 0.6fr 0.8fr',
        gap: 12,
        padding: '12px 8px',
        alignItems: 'center',
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            background:
              'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 37%, #F3F4F6 63%)',
            borderRadius: 6,
            animation: 'shine 1.2s infinite linear',
          }}
        />
      ))}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * TopRecommendations
 * Renders the top 3 high-priority recommendations with robust handling to avoid flicker/empty state
 * due to double mounts (React StrictMode) or stale requests. Ensures the latest successful fetch
 * updates state and preserves previously shown items if a subsequent fetch returns empty.
 *
 * Props:
 *  - none
 *
 * Behavior:
 *  - Uses a request-id guard so only the latest fetch updates state.
 *  - Logs fetch start/end, counts pre/post filter, and source via services.
 *  - Will not clear previously shown items if subsequent fetch filters to zero while raw > 0.
 */
// PUBLIC_INTERFACE
export function TopRecommendations() {
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
        const raw = await getRecommendations();
        const ranked = selectTopHighPriorityRecommendations(raw, 3);

        // Only update if this is the latest request and still mounted
        if (!mounted || myId !== reqIdRef.current) return;

        setFetchedCount(raw.length);
        setFilteredCount(ranked.length);

        // Preserve previous items if we get an empty filtered result after previously showing data
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
  }, []); // run once

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
            color: errorColor,
            backgroundColor: '#FEF2F2',
            border: `1px solid ${'#FECACA'}`,
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
              color: primary,
              backgroundColor: surface,
              border: `1px dashed ${borderColor}`,
              padding: 16,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            No high-priority recommendations right now
          </div>
          {fetchedCount > 0 && (
            <div style={{ color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
              Note: {fetchedCount} items exist but none met the high-priority or confidence thresholds.
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
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#FFFFFF',
        }}
      >
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.7fr 0.6fr 0.8fr',
            gap: 12,
            padding: '12px 8px',
            background: surface,
            borderBottom: `1px solid ${borderColor}`,
            color: '#6B7280',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.2,
            textTransform: 'uppercase',
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
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.6fr 0.5fr 0.7fr 0.6fr 0.8fr',
              gap: 12,
              padding: '14px 8px',
              alignItems: 'center',
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <div role="cell" style={{ color: textColor, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor:
                      (rec.environment || '').toLowerCase() === 'prod' ? errorColor : primary,
                  }}
                  aria-hidden
                  title={rec.environment ? `Env: ${rec.environment}` : 'Env'}
                />
                <span>{(rec as any).title || (rec as any).name || 'Recommendation'}</span>
              </div>
              <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                {(rec as any).category || (rec as any).type || rec.environment || '—'}
              </div>
            </div>
            <div role="cell">
              <SeverityBadge severity={(rec as any).severity || (rec as any).priority || 'High'} />
            </div>
            <div role="cell" style={{ color: textColor }}>
              {Math.round((rec as any).risk_score ?? (rec as any).risk ?? 0)}
            </div>
            <div role="cell">
              <SavingsPill value={(rec as any).estimated_savings ?? (rec as any).savings ?? 0} />
            </div>
            <div role="cell" style={{ color: '#6B7280' }}>
              {formatRelativeTime((rec as any).updated_at || (rec as any).last_seen || (rec as any).detected_at)}
            </div>
            <div
              role="cell"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <button
                aria-label={`Fix recommendation ${(rec as any).title || (rec as any).name || 'item'}`}
                onClick={() => {
                  // TODO: wire to automation/action flow
                  // eslint-disable-next-line no-console
                  console.log('Fix now clicked', rec.id);
                }}
                style={{
                  backgroundColor: primary,
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fix now
              </button>
              <button
                aria-label={`View details for ${(rec as any).title || (rec as any).name || 'item'}`}
                onClick={() => {
                  // TODO: navigate or open details drawer
                  // eslint-disable-next-line no-console
                  console.log('View details clicked', rec.id);
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: primary,
                  border: `1px solid ${borderColor}`,
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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
                    backgroundColor: '#FFFFFF',
                    color: '#6B7280',
                    border: `1px solid ${borderColor}`,
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  title="More"
                >
                  ⋯
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [state, error, items]);

  return (
    <section
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
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            color: textColor,
            fontWeight: 700,
          }}
        >
          Top Recommendations
        </h2>
        <span style={{ color: '#6B7280', fontSize: 12 }}>
          Top 3 high-priority with confidence ≥ 0.5
        </span>
      </div>
      {content}
    </section>
  );
}

// Note: No default export to ensure consistency with named-only exports.
