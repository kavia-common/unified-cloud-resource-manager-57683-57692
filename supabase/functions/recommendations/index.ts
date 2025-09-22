import { serve } from "https://deno.land/std/http/server.ts";

/**
 * recommendations Edge Function
 *
 * Purpose:
 * - Analyze resources and costs to produce AI/ML-like recommendations:
 *   - Idle resource detection (stopped but accruing cost, or running with low utilization)
 *   - Rightsizing (scale down based on size marker in metadata or tags)
 *   - Anomaly detection (sudden cost spike vs. previous month)
 * - Insert raw recommendations into public.recommendations.
 * - Log activity to public.activity_log.
 *
 * Auth:
 * - Requires Authorization: Bearer <Supabase JWT>
 * - Associates results with auth user (auth.sub).
 *
 * Routes:
 * - POST /run (optional body: { modes?: ["idle","rightsizing","anomaly"] })
 *   Default runs all modes.
 *
 * Implementation notes:
 * - Uses PostgREST with service role key for writes.
 * - Lightweight heuristic logic to simulate AI/ML for MVP.
 */
serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (url.pathname !== "/run") {
      return json({ error: "Not found" }, 404);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const userId = getUserIdFromJwt(jwt || "");
    if (!jwt || !userId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: "Server misconfigured: missing SUPABASE_URL or key" }, 500);
    }

    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const modes = Array.isArray(body?.modes) && body.modes.length ? body.modes : ["idle", "rightsizing", "anomaly"];

    // Load resources for this user
    const resResp = await fetch(`${SUPABASE_URL}/rest/v1/resources?user_id=eq.${userId}&select=*`, {
      headers: apiHeaders(SERVICE_KEY),
    });
    if (!resResp.ok) {
      const t = await resResp.text();
      return json({ error: `Failed to fetch resources: ${t}` }, 500);
    }
    const resources: any[] = await resResp.json();

    // Optional: load this user's costs_breakdown for anomaly detection
    const month = new Date();
    month.setUTCDate(1);
    const monthStr = month.toISOString().slice(0, 10);
    const prevMonth = new Date(month);
    prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 10);

    const costsCurResp = await fetch(
      `${SUPABASE_URL}/rest/v1/costs_breakdown?user_id=eq.${userId}&month=eq.${monthStr}&select=*`,
      { headers: apiHeaders(SERVICE_KEY) }
    );
    const costsPrevResp = await fetch(
      `${SUPABASE_URL}/rest/v1/costs_breakdown?user_id=eq.${userId}&month=eq.${prevMonthStr}&select=*`,
      { headers: apiHeaders(SERVICE_KEY) }
    );
    const costsCur = costsCurResp.ok ? await costsCurResp.json() : [];
    const costsPrev = costsPrevResp.ok ? await costsPrevResp.json() : [];

    const recsToInsert: any[] = [];

    // Idle resource detection
    if (modes.includes("idle")) {
      for (const r of resources) {
        const daily = Number(r?.cost_daily || 0);
        const state = String(r?.state || "");
        // Heuristic: Consider idle if stopped but daily cost > 0.2 OR running with low utilization hint
        const utilHint = Number(r?.metadata?.utilization || r?.metadata?.cpu_utilization || 0);
        if ((state === "stopped" && daily > 0.2) || (state === "running" && utilHint > 0 && utilHint < 10 && daily >= 2)) {
          const impactMonthly = Number(r?.cost_monthly || (daily * 30)) * 0.6; // assume we can save 60%
          recsToInsert.push({
            user_id: userId,
            resource_id: r.id,
            title: `Idle ${r.type || "resource"} detected`,
            reason: state === "stopped"
              ? `Resource is stopped but incurring ~$${daily.toFixed(2)}/day.`
              : `Low utilization (~${utilHint}%) with spend ~$${daily.toFixed(2)}/day.`,
            priority: 80,
            impact: round2(impactMonthly),
            provider: r.provider,
            metadata: { kind: "idle", daily_cost: daily, state, suggested_action: "stop_or_deprovision" },
            created_at: now,
          });
        }
      }
    }

    // Rightsizing suggestions (simple size marker in tags/metadata or cost threshold)
    if (modes.includes("rightsizing")) {
      for (const r of resources) {
        const type = String(r?.type || "").toLowerCase();
        if (!/ec2|vm|computeengine/.test(type)) continue;
        const size = String(r?.metadata?.size || r?.tags?.size || "").toLowerCase();
        const daily = Number(r?.cost_daily || 0);
        // Heuristic: if size is "large" and daily cost > 10, suggest "medium"
        if ((size === "large" && daily > 10) || daily > 15) {
          const impactMonthly = Number(r?.cost_monthly || (daily * 30)) * 0.35; // assume 35% savings by scaling down
          recsToInsert.push({
            user_id: userId,
            resource_id: r.id,
            title: `Rightsize ${r.type || "compute"} to smaller size`,
            reason: `Detected potential oversizing (size=${size || "unknown"}; cost ~$${daily.toFixed(2)}/day).`,
            priority: 70,
            impact: round2(impactMonthly),
            provider: r.provider,
            metadata: { kind: "rightsizing", current_size: size || "unknown", target_size: "medium" },
            created_at: now,
          });
        }
      }
    }

    // Anomaly detection based on costs_breakdown delta by service
    if (modes.includes("anomaly") && Array.isArray(costsCur) && Array.isArray(costsPrev)) {
      const sumByService = (rows: any[]) => {
        const map: Record<string, number> = {};
        for (const row of rows) {
          const k = String(row.service || "unknown");
          map[k] = (map[k] || 0) + Number(row.amount || 0);
        }
        return map;
      };
      const curMap = sumByService(costsCur);
      const prevMap = sumByService(costsPrev);
      for (const svc of Object.keys(curMap)) {
        const cur = curMap[svc] || 0;
        const prev = prevMap[svc] || 0;
        if (prev > 0 && cur > prev * 1.5 && cur - prev > 50) {
          // 50%+ jump and >$50 absolute increase
          const impactMonthly = cur - prev;
          recsToInsert.push({
            user_id: userId,
            resource_id: null,
            title: `Anomalous spend spike detected in ${svc}`,
            reason: `Spend increased from ~$${round2(prev)} to ~$${round2(cur)} compared to previous month.`,
            priority: 90,
            impact: round2(impactMonthly),
            provider: null,
            metadata: { kind: "anomaly", service: svc, prev, cur },
            created_at: now,
          });
        }
      }
    }

    // Insert recommendations if any
    let inserted = 0;
    if (recsToInsert.length) {
      const batchResp = await fetch(`${SUPABASE_URL}/rest/v1/recommendations`, {
        method: "POST",
        headers: {
          ...apiHeaders(SERVICE_KEY),
          Prefer: "return=representation",
        },
        body: JSON.stringify(recsToInsert),
      });
      if (!batchResp.ok) {
        const t = await batchResp.text();
        return json({ error: `Failed to insert recommendations: ${t}` }, 500);
      }
      const out = await batchResp.json();
      inserted = Array.isArray(out) ? out.length : 0;
    }

    // Activity log
    await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
      method: "POST",
      headers: {
        ...apiHeaders(SERVICE_KEY),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        actor: userId,
        type: "recommendations_run",
        summary: `Generated ${inserted} recommendation(s) [modes=${modes.join(",")}]`,
        status: "success",
        created_at: now,
      }),
    });

    return json({ message: "Recommendations generated", inserted, modes });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function apiHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    "apikey": key,
    "Authorization": `Bearer ${key}`,
  };
}

function getUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(padB64(parts[1])));
    return payload?.sub || null;
  } catch {
    return null;
  }
}
function padB64(b: string) {
  return b.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b.length % 4)) % 4);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
