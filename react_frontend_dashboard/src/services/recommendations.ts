import { getSupabaseClient } from '../lib/supabaseClient';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface Recommendation {
  id: string | number;
  title: string;
  category?: string | null;
  severity?: string | null;
  risk_score?: number | null;
  estimated_savings?: number | null;
  environment?: string | null; // e.g., 'prod', 'dev', etc.
  confidence?: number | null; // 0..1
  actionable?: boolean | null;
  updated_at?: string | null; // ISO timestamp
}

export interface RankedRecommendation extends Recommendation {
  severity_norm: number; // 1.0 for Critical, 0.8 for High
  normRisk: number;
  normSavings: number;
  recencyDecay: number;
  priority: number;
}

const DEFAULT_TABLE_NAME = 'ai_recommendations';

/**
 * PUBLIC_INTERFACE
 * getRecommendations
 * Fetches AI recommendations from Supabase with graceful handling for missing client or table.
 * Selects relevant fields and returns raw records.
 */
export async function getRecommendations(options?: {
  tableName?: string;
}): Promise<Recommendation[]> {
  const table = options?.tableName || DEFAULT_TABLE_NAME;
  const supabase = getSupabaseClient();

  // If no supabase client (e.g., env missing), return empty gracefully
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from(table)
      .select(
        'id, title, category, severity, risk_score, estimated_savings, environment, confidence, actionable, updated_at'
      )
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch recommendations:', error.message);
      return [];
    }

    const safeData = (data || []).map((r: any): Recommendation => ({
      id: r.id ?? String(Math.random()),
      title: r.title ?? 'Recommendation',
      category: r.category ?? null,
      severity: r.severity ?? null,
      risk_score: typeof r.risk_score === 'number' ? r.risk_score : null,
      estimated_savings:
        typeof r.estimated_savings === 'number' ? r.estimated_savings : null,
      environment: r.environment ?? null,
      confidence:
        typeof r.confidence === 'number' ? r.confidence : (r.confidence ? Number(r.confidence) : null),
      actionable: typeof r.actionable === 'boolean' ? r.actionable : !!r.actionable,
      updated_at: r.updated_at ?? null,
    }));

    return safeData;
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn('Recommendations fetch error:', e?.message || e);
    return [];
  }
}

function normalizeSeverity(sev?: string | null): Severity | null {
  if (!sev) return null;
  const s = String(sev).trim().toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'high') return 'High';
  if (s === 'medium') return 'Medium';
  if (s === 'low') return 'Low';
  if (s === 'info' || s === 'informational') return 'Info';
  return null;
}

function normalizeEnv(env?: string | null): string | null {
  if (!env) return null;
  return String(env).trim().toLowerCase();
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function daysSince(dateISO?: string | null): number {
  if (!dateISO) return 0;
  const t = new Date(dateISO).getTime();
  if (!Number.isFinite(t)) return 0;
  const now = Date.now();
  return Math.max(0, (now - t) / 86400000);
}

/**
 * PUBLIC_INTERFACE
 * selectTopHighRiskRecommendations
 * Applies filtering, scoring, ranking, and selection of top N (default 3) recommendations.
 */
export function selectTopHighRiskRecommendations(
  items: Recommendation[],
  topN = 3
): RankedRecommendation[] {
  // Filter on actionable, confidence >= 0.7, severity in ['Critical', 'High']
  const filtered = items
    .map((r) => ({
      ...r,
      severity: normalizeSeverity(r.severity),
      environment: normalizeEnv(r.environment),
    }))
    .filter((r) => !!r.actionable)
    .filter((r) => (r.confidence ?? 0) >= 0.7)
    .filter((r) => r.severity === 'Critical' || r.severity === 'High');

  if (filtered.length === 0) return [];

  // For normSavings normalization, compute max estimated_savings among filtered
  const maxSavings = filtered.reduce((m, r) => {
    const v = typeof r.estimated_savings === 'number' ? r.estimated_savings : 0;
    return v > m ? v : m;
  }, 0);

  // Compute components and priority
  const ranked: RankedRecommendation[] = filtered.map((r) => {
    const severity_weight = r.severity === 'Critical' ? 1.0 : r.severity === 'High' ? 0.8 : 0;
    const normRisk = clamp01(((r.risk_score ?? 0) as number) / 100);
    const normSavings =
      maxSavings > 0 ? clamp01(((r.estimated_savings ?? 0) as number) / maxSavings) : 0;
    const ds = daysSince(r.updated_at);
    const recencyDecay = r.updated_at ? Math.exp(-ds / 14) : 0.5;

    const priority =
      0.4 * severity_weight + 0.3 * normRisk + 0.2 * normSavings + 0.1 * recencyDecay;

    return {
      ...r,
      severity_norm: severity_weight,
      normRisk,
      normSavings,
      recencyDecay,
      priority,
    };
  });

  // Sort: priority desc; tie-breakers: prod env first, higher risk_score, higher savings, newer updated_at
  ranked.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;

    const envA = a.environment === 'prod' ? 1 : 0;
    const envB = b.environment === 'prod' ? 1 : 0;
    if (envB !== envA) return envB - envA;

    const riskA = a.risk_score ?? 0;
    const riskB = b.risk_score ?? 0;
    if (riskB !== riskA) return riskB - riskA;

    const saveA = a.estimated_savings ?? 0;
    const saveB = b.estimated_savings ?? 0;
    if (saveB !== saveA) return saveB - saveA;

    const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return tB - tA;
  });

  return ranked.slice(0, topN);
}

/**
 * PUBLIC_INTERFACE
 * formatCurrency
 * Formats a number in USD with compact notation, e.g., $12.3K.
 */
export function formatCurrency(value?: number | null): string {
  if (!value || !Number.isFinite(value)) return '-';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}

/**
 * PUBLIC_INTERFACE
 * formatRelativeTime
 * Returns a short relative time from an ISO date string, e.g., '2d ago'.
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const seconds = Math.floor((Date.now() - t) / 1000);

  const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let count = seconds;
  let unit: Intl.RelativeTimeFormatUnit = 'second';

  for (let i = 0; i < intervals.length; i++) {
    const [size, u] = intervals[i];
    if (count < size) {
      unit = u;
      break;
    }
    count = Math.floor(count / size);
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return rtf.format(-count, unit);
}
