import { getSupabaseClient } from '../lib/supabaseClient';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface Recommendation {
  id: string | number;
  title: string;
  category?: string | null;
  severity?: string | null;
  priority?: string | null; // e.g., P0/P1/P2 if exists
  risk_score?: number | null;
  category_priority?: number | null;
  estimated_savings?: number | null;
  environment?: string | null; // e.g., 'prod', 'dev', etc.
  confidence?: number | null; // 0..1
  actionable?: boolean | null;
  updated_at?: string | null; // ISO timestamp
  detected_at?: string | null; // alternative timestamp
}

export interface RankedRecommendation extends Recommendation {
  severityWeight: number; // 1.0 for Critical, 0.85 for High, else 0.6
  riskScoreNorm: number;
  recencyDecay: number;
  priorityScore: number;
}

const PRIMARY_SOURCES = ['ai_automation_rules', 'automation_rules', 'ai_rules'];
const FALLBACK_SOURCES = ['ai_recommendations'];

/**
 * PUBLIC_INTERFACE
 * getRecommendations
 * Fetches recommendations from Supabase using the same table/view as AI Automation Rules if available,
 * with a fallback to ai_recommendations. Includes robust field mapping for differing schemas.
 */
export async function getRecommendations(): Promise<Recommendation[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  // Helper to run a query and map results from an arbitrary table/view
  async function querySource(table: string): Promise<Recommendation[]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(400);

      if (error) {
        console.warn(`[TopRecs] Query error from ${table}:`, error.message);
        return [];
      }

      const mapped: Recommendation[] = (data || []).map((r: any): Recommendation => {
        // Robust field mapping across potential schemas
        const id =
          r.id ??
          r.rule_id ??
          r.recommendation_id ??
          r.uuid ??
          `${table}-${Math.random().toString(36).slice(2)}`;

        const title = r.title ?? r.name ?? r.rule_name ?? r.recommendation ?? 'Recommendation';

        const category =
          r.category ??
          r.type ??
          r.rule_type ??
          r.kind ??
          r.category_name ??
          null;

        // severity/priority mapping
        const severityRaw = r.severity ?? r.level ?? r.priority ?? null;
        const normalizedSeverity = normalizeSeverity(severityRaw);
        const priorityLabel = typeof r.priority === 'string' ? r.priority : null;

        const risk_score = toNumber(
          r.risk_score ?? r.risk ?? r.riskLevel ?? r.score ?? r.threat_score
        );

        const category_priority = toNumber(r.category_priority ?? r.impact_score ?? r.weight);

        const estimated_savings = toNumber(
          r.estimated_savings ?? r.savings ?? r.estimated_savings_monthly ?? r.cost_savings
        );

        const environment =
          (r.environment ?? r.env ?? r.stage ?? r.account_env ?? null) &&
          String(r.environment ?? r.env ?? r.stage ?? r.account_env).toLowerCase();

        // confidence mapping
        let confidence: number | null = null;
        if (typeof r.confidence === 'number') confidence = r.confidence;
        else if (typeof r.score === 'number') confidence = r.score / 100;
        else if (typeof r.confidence_score === 'number') confidence = r.confidence_score;
        else if (r.confidence != null) {
          const n = Number(r.confidence);
          confidence = Number.isFinite(n) ? (n > 1 ? n / 100 : n) : null;
        }

        // actionable mapping
        const actionable =
          typeof r.actionable === 'boolean'
            ? r.actionable
            : r.is_actionable === true ||
              r.suggested_action != null ||
              r.action != null ||
              r.fix_available === true
            ? true
            : null;

        const updated_at = r.updated_at ?? r.last_updated ?? r.last_seen ?? null;
        const detected_at = r.detected_at ?? r.created_at ?? r.first_seen ?? null;

        return {
          id,
          title,
          category,
          severity: normalizedSeverity ?? (typeof severityRaw === 'string' ? severityRaw : null),
          priority: priorityLabel,
          risk_score,
          category_priority,
          estimated_savings,
          environment,
          confidence,
          actionable,
          updated_at,
          detected_at,
        };
      });

      return mapped;
    } catch (e: any) {
      console.warn(`[TopRecs] Unexpected error from ${table}:`, e?.message || e);
      return [];
    }
  }

  // Try primary sources first (AI Automation Rules family)
  for (const table of PRIMARY_SOURCES) {
    const items = await querySource(table);
    if (items.length > 0) {
      console.info(`[TopRecs] Using source: ${table} (${items.length} rows)`);
      return items;
    }
  }

  // Fallback sources (ai_recommendations etc.)
  for (const table of FALLBACK_SOURCES) {
    const items = await querySource(table);
    if (items.length > 0) {
      console.info(`[TopRecs] Using fallback source: ${table} (${items.length} rows)`);
      return items;
    }
  }

  console.warn('[TopRecs] No data from any known source.');
  return [];
}

function toNumber(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeSeverity(sev?: string | null): Severity | null {
  if (!sev) return null;
  const s = String(sev).trim().toLowerCase();
  if (s === 'critical' || s === 'p0') return 'Critical';
  if (s === 'high' || s === 'p1') return 'High';
  if (s === 'medium' || s === 'p2') return 'Medium';
  if (s === 'low' || s === 'p3') return 'Low';
  if (s === 'info' || s === 'informational') return 'Info';
  return null;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
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
 * selectTopHighPriorityRecommendations
 * Applies relaxed filtering and priority scoring to select the top N (default 3) high-priority items.
 *
 * High priority if:
 *  - severity in ['Critical','High'] OR
 *  - priority in ['P0','P1'] OR
 *  - category_priority >= 80 (if field exists)
 *
 * Confidence threshold: >= 0.5
 *
 * Scoring:
 *   priorityScore = 0.45*severityWeight + 0.35*riskScoreNorm + 0.2*recencyDecay
 *   severityWeight: Critical=1.0, High=0.85, else 0.6
 *   riskScoreNorm = (risk_score || risk || 0)/100
 *   recencyDecay = exp(-daysSince(updated_at||detected_at)/21)
 *
 * Sort desc by priorityScore,
 * tie-breakers: environment==='prod' > higher risk > newer updated_at.
 */
export function selectTopHighPriorityRecommendations(
  items: Recommendation[],
  topN = 3
): RankedRecommendation[] {
  const mapped = items.map((r) => {
    const sevNorm = normalizeSeverity(r.severity ?? r.priority ?? null);
    const riskNorm = clamp01((toNumber(r.risk_score) ?? 0) / 100);
    const recencyBase = r.updated_at ?? r.detected_at ?? null;
    const ds = daysSince(recencyBase);
    const recencyDecay = Math.exp(-ds / 21);

    const severityWeight =
      sevNorm === 'Critical' ? 1.0 : sevNorm === 'High' ? 0.85 : 0.6;

    const priorityScore = 0.45 * severityWeight + 0.35 * riskNorm + 0.2 * recencyDecay;

    return {
      ...r,
      severity: sevNorm ?? r.severity ?? r.priority ?? null,
      severityWeight,
      riskScoreNorm: riskNorm,
      recencyDecay,
      priorityScore,
      environment: r.environment ? String(r.environment).toLowerCase() : null,
    } as RankedRecommendation;
  });

  const totalFetched = mapped.length;

  // Relaxed filtering based on provided rules
  const filtered = mapped.filter((r) => {
    const highSeverity =
      r.severity === 'Critical' || r.severity === 'High';

    const highPriorityLabel =
      (r.priority && ['P0', 'P1'].includes(String(r.priority).toUpperCase())) ||
      // some datasets overload severity field with P0/P1
      (typeof r.severity === 'string' &&
        ['P0', 'P1'].includes(String(r.severity).toUpperCase()));

    const highCategoryPriority =
      (toNumber(r.category_priority) ?? -1) >= 80;

    const passesPriority = highSeverity || highPriorityLabel || highCategoryPriority;

    const conf = toNumber(r.confidence);
    const passesConfidence = conf == null ? true : conf >= 0.5;

    // Actionable only if the field exists and is explicitly false -> then exclude.
    // If missing, do not filter.
    const actionableKnown = typeof r.actionable === 'boolean';
    const passesActionable = actionableKnown ? r.actionable === true : true;

    return passesPriority && passesConfidence && passesActionable;
  });

  if (filtered.length === 0) {
    if (totalFetched > 0) {
      console.warn(
        `[TopRecs] 0 items after filtering. fetched=${totalFetched}, filtered=0 (severity/confidence/actionable filters may be too strict)`
      );
    }
    return [];
  }

  // Sort by priorityScore desc; tie-breakers
  filtered.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;

    const envA = a.environment === 'prod' ? 1 : 0;
    const envB = b.environment === 'prod' ? 1 : 0;
    if (envB !== envA) return envB - envA;

    const riskA = toNumber(a.risk_score) ?? 0;
    const riskB = toNumber(b.risk_score) ?? 0;
    if (riskB !== riskA) return riskB - riskA;

    const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return tB - tA;
  });

  return filtered.slice(0, topN);
}

/**
 * PUBLIC_INTERFACE
 * formatCurrency
 * Formats a number in USD with compact notation, e.g., $12.3K.
 */
export function formatCurrency(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `$${Number(value).toFixed(0)}`;
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
