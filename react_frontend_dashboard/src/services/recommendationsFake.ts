import { selectTopHighPriorityRecommendations, type Recommendation } from './recommendations';

/**
 * PUBLIC_INTERFACE
 * getTop3HighPriorityFromFake
 * Returns the top 3 high-priority recommendations directly from in-app fake/static data used by
 * the Recommendations feature. This bypasses Supabase to ensure the dashboard Top Recommendations
 * renders reliably during development.
 *
 * Notes:
 * - The existing Recommendations page defines mock inputs inside the component rather than exporting them.
 *   To avoid coupling to component instance state, we provide a minimal static surrogate dataset here that
 *   resembles the transformed output the TopRecommendations table expects (fields normalized).
 * - Be resilient to different field names: title/name, severity/priority, risk_score/risk, updated_at/last_seen,
 *   category/type, estimated_savings/savings, environment/env.
 * - When the project later exposes a shared fake dataset export, we can replace this local array with an import.
 */
export function getTop3HighPriorityFromFake(): Recommendation[] {
  // Minimal surrogate items with varied severities/fields for robust mapping.
  // TODO: Replace with a shared exported fake dataset if one is introduced.
  const FAKE_RECOMMENDATIONS: any[] = [
    {
      id: 'fake-underutilized-i-001',
      title: 'Stop underutilized VM web-01',
      category: 'Underutilized Resource',
      severity: 'High',
      risk_score: 78,
      estimated_savings: 120.0,
      environment: 'prod',
      confidence: 0.85,
      actionable: true,
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(), // 2d ago
    },
    {
      id: 'fake-unused-snapshot',
      name: 'Delete unused SNAPSHOT snap-001',
      type: 'Unused Asset',
      priority: 'P1',
      risk: 65,
      savings: 40.0,
      env: 'dev',
      confidence: 0.9,
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(), // 1d ago
    },
    {
      id: 'fake-rightsize-db',
      title: 'Right-size DB orders-db',
      category: 'Right-Sizing',
      severity: 'Critical',
      risk_score: 82,
      estimated_savings: 260.0,
      environment: 'prod',
      confidence: 0.7,
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(), // 5d ago
    },
    {
      id: 'fake-schedule-dev-vm',
      title: 'Enable auto-off schedule for dev-api-01',
      category: 'Scheduling',
      severity: 'Medium',
      risk_score: 40,
      estimated_savings: 65.0,
      environment: 'dev',
      confidence: 0.95,
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(), // 3d ago
    },
  ];

  // Normalize into Recommendation structure; permissive field mapping.
  const mapped: Recommendation[] = FAKE_RECOMMENDATIONS.map((r: any) => {
    const id = r.id ?? `fake-${Math.random().toString(36).slice(2)}`;
    const title = r.title ?? r.name ?? 'Recommendation';
    const category = r.category ?? r.type ?? null;
    const severity = r.severity ?? r.priority ?? null;
    const priority = typeof r.priority === 'string' ? r.priority : null;
    const risk_score = toNumber(r.risk_score ?? r.risk);
    const estimated_savings = toNumber(r.estimated_savings ?? r.savings);
    const environment =
      (r.environment ?? r.env ?? null) && String(r.environment ?? r.env).toLowerCase();
    const confidence = toNumber(r.confidence);
    const actionable =
      typeof r.actionable === 'boolean' ? r.actionable : r.action != null ? true : null;
    const updated_at = r.updated_at ?? r.last_seen ?? null;
    const detected_at = r.detected_at ?? null;

    return {
      id,
      title,
      category,
      severity,
      priority,
      risk_score,
      category_priority: null,
      estimated_savings,
      environment,
      confidence,
      actionable,
      updated_at,
      detected_at,
    };
  });

  // Reuse the same selector to ensure consistent filtering and sorting rules
  const ranked = selectTopHighPriorityRecommendations(mapped, 3);
  return ranked;
}

// Local numeric coercion to avoid importing private helpers
function toNumber(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
