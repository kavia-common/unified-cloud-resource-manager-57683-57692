import { serve } from "https://deno.land/std/http/server.ts";

/**
 * automation-enforcer Edge Function
 *
 * Purpose:
 * - Evaluate enabled automation_rules for the authenticated user.
 * - Select matching resources using a simple tag query in rule.match (e.g., "env=dev AND type=vm").
 * - Enqueue operations into public.operations with status=queued.
 * - Record automation_rule_runs and log to activity_log.
 *
 * Trigger:
 * - Can be invoked via Supabase Scheduler (cron) hitting POST /run.
 * - Can also be triggered by client on demand (POST /run).
 *
 * Auth:
 * - Requires Authorization: Bearer <Supabase JWT>.
 */
serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/run") {
      return json({ error: "Not found" }, 404);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const userId = getUserIdFromJwt(jwt || "");
    if (!jwt || !userId) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Server misconfigured" }, 500);

    const now = new Date().toISOString();

    // Fetch enabled rules for this user
    const rulesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/automation_rules?user_id=eq.${userId}&status=eq.enabled&select=*`,
      { headers: apiHeaders(SERVICE_KEY) }
    );
    if (!rulesResp.ok) {
      const t = await rulesResp.text();
      return json({ error: `Failed to fetch rules: ${t}` }, 500);
    }
    const rules: any[] = await rulesResp.json();

    if (!rules.length) {
      await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
        actor: userId,
        type: "automation_enforcer",
        summary: "No enabled rules to enforce",
        status: "success",
        created_at: now,
      });
      return json({ message: "No enabled rules" });
    }

    // Load resources for user
    const resResp = await fetch(`${SUPABASE_URL}/rest/v1/resources?user_id=eq.${userId}&select=*`, {
      headers: apiHeaders(SERVICE_KEY),
    });
    const resources: any[] = resResp.ok ? await resResp.json() : [];

    let totalQueued = 0;
    const runRecords: any[] = [];

    for (const rule of rules) {
      const matches = filterByRule(resources, rule.match || "");
      const opsPayload = matches.map((r: any) => ({
        user_id: userId,
        resource_id: r.id,
        operation: rule.action,
        params: rule.action === "scale" ? { size: "medium", rule_id: rule.id } : { rule_id: rule.id },
        status: "queued",
        created_at: now,
        updated_at: now,
      }));

      // Enqueue operations
      let queued = 0;
      if (opsPayload.length) {
        const opsResp = await fetch(`${SUPABASE_URL}/rest/v1/operations`, {
          method: "POST",
          headers: { ...apiHeaders(SERVICE_KEY), Prefer: "return=representation" },
          body: JSON.stringify(opsPayload),
        });
        if (!opsResp.ok) {
          // Log failure for this rule
          const errText = await opsResp.text();
          runRecords.push({ rule_id: rule.id, status: "error", error: errText, count: 0 });
        } else {
          const inserted = await opsResp.json();
          queued = Array.isArray(inserted) ? inserted.length : 0;
          runRecords.push({ rule_id: rule.id, status: "success", count: queued });
        }
      } else {
        runRecords.push({ rule_id: rule.id, status: "success", count: 0 });
      }
      totalQueued += queued;

      // Record automation rule run
      await fetch(`${SUPABASE_URL}/rest/v1/automation_rule_runs`, {
        method: "POST",
        headers: { ...apiHeaders(SERVICE_KEY), Prefer: "return=minimal" },
        body: JSON.stringify({
          rule_id: rule.id,
          user_id: userId,
          started_at: now,
          finished_at: now,
          status: "success",
          details: { queued },
        }),
      });

      // Log activity
      await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
        actor: userId,
        type: "rule_run",
        summary: `Rule "${rule.name}" enqueued ${queued} operation(s)`,
        status: "success",
        created_at: now,
      });
    }

    // Overall activity
    await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
      actor: userId,
      type: "automation_enforcer",
      summary: `Processed ${rules.length} rule(s); queued ${totalQueued} operation(s)`,
      status: "success",
      created_at: now,
    });

    return json({ message: "Automation enforcement complete", rules: rules.length, queued: totalQueued, runs: runRecords });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function filterByRule(resources: any[], match: string): any[] {
  if (!match) return resources;
  // Very simple parser: clauses split by AND, format key=value; supports type, provider, region, and tags.<key>
  const clauses = String(match)
    .split(/\s+AND\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return resources.filter((r) => {
    return clauses.every((cl) => {
      const [k, vRaw] = cl.split("=").map((s) => s.trim());
      const v = (vRaw || "").replace(/^['"]|['"]$/g, "");
      if (!k) return true;
      if (k.toLowerCase() === "type") return String(r.type || "").toLowerCase() === v.toLowerCase();
      if (k.toLowerCase() === "provider") return String(r.provider || "").toLowerCase() === v.toLowerCase();
      if (k.toLowerCase() === "region") return String(r.region || "").toLowerCase() === v.toLowerCase();
      if (k.toLowerCase().startsWith("tags.")) {
        const tagKey = k.slice(5);
        const tagVal = r?.tags?.[tagKey];
        return String(tagVal || "").toLowerCase() === v.toLowerCase();
      }
      // fallback to direct field compare
      const val = r?.[k];
      return String(val || "").toLowerCase() === v.toLowerCase();
    });
  });
}

async function writeActivity(url: string, key: string, userId: string, row: Record<string, unknown>) {
  await fetch(`${url}/rest/v1/activity_log`, {
    method: "POST",
    headers: { ...apiHeaders(key), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}

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
