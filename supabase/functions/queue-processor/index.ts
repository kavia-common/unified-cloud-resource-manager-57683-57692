import { serve } from "https://deno.land/std/http/server.ts";

/**
 * queue-processor Edge Function
 *
 * Purpose:
 * - Process queued rows in:
 *    a) public.operations (resource lifecycle ops)
 *    b) public.recommendation_actions (apply/ignore)
 * - Update status -> running -> success/error and write results.
 * - Emit activity_log entries for user feedback.
 *
 * Trigger:
 * - Can be scheduled via Supabase Cron or called manually.
 *
 * Auth:
 * - Requires Authorization: Bearer <Supabase JWT>.
 *
 * Routes:
 * - POST /run (optional body: { max?: number })
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
    const body = await req.json().catch(() => ({}));
    const max = Number(body?.max || 20);

    // Load queued operations for this user
    const opsResp = await fetch(
      `${SUPABASE_URL}/rest/v1/operations?user_id=eq.${userId}&status=eq.queued&select=*&limit=${max}`,
      { headers: apiHeaders(SERVICE_KEY) }
    );
    const ops: any[] = opsResp.ok ? await opsResp.json() : [];

    // Load queued recommendation_actions
    const recActResp = await fetch(
      `${SUPABASE_URL}/rest/v1/recommendation_actions?user_id=eq.${userId}&status=eq.queued&select=*&limit=${max}`,
      { headers: apiHeaders(SERVICE_KEY) }
    );
    const racs: any[] = recActResp.ok ? await recActResp.json() : [];

    let processedOps = 0;
    let processedRecActs = 0;

    // Process operations: simulate execution
    for (const op of ops) {
      await updateRow(`${SUPABASE_URL}/rest/v1/operations?id=eq.${op.id}`, SERVICE_KEY, {
        status: "running",
        updated_at: now,
      });
      // Simulate execution
      const result = simulateOperation(op.operation, op.params);
      await updateRow(`${SUPABASE_URL}/rest/v1/operations?id=eq.${op.id}`, SERVICE_KEY, {
        status: "success",
        result,
        updated_at: now,
      });
      processedOps += 1;
      await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
        actor: userId,
        type: "operation",
        summary: `Operation ${op.operation} executed on resource ${op.resource_id}`,
        status: "success",
        created_at: now,
      });
    }

    // Process recommendation_actions: simulate apply
    for (const ra of racs) {
      await updateRow(`${SUPABASE_URL}/rest/v1/recommendation_actions?id=eq.${ra.id}`, SERVICE_KEY, {
        status: "running",
        updated_at: now,
      });
      const result = { message: `Applied recommendation ${ra.recommendation_id}` };
      await updateRow(`${SUPABASE_URL}/rest/v1/recommendation_actions?id=eq.${ra.id}`, SERVICE_KEY, {
        status: "success",
        result,
        updated_at: now,
      });
      processedRecActs += 1;
      await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
        actor: userId,
        type: "recommendation_apply",
        summary: `Applied recommendation ${ra.recommendation_id}`,
        status: "success",
        created_at: now,
      });
    }

    // Overall activity
    await writeActivity(SUPABASE_URL, SERVICE_KEY, userId, {
      actor: userId,
      type: "queue_processor",
      summary: `Processed ${processedOps} operation(s) and ${processedRecActs} recommendation action(s)`,
      status: "success",
      created_at: now,
    });

    return json({ message: "Queue processed", operations: processedOps, recommendation_actions: processedRecActs });
  } catch (e) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function simulateOperation(op: string, params: any) {
  if (op === "start") return { ok: true, details: "Resource started" };
  if (op === "stop") return { ok: true, details: "Resource stopped" };
  if (op === "scale") return { ok: true, details: `Scaled to ${params?.size || "medium"}` };
  return { ok: true, details: "No-op" };
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
async function updateRow(url: string, key: string, patch: Record<string, unknown>) {
  await fetch(url, {
    method: "PATCH",
    headers: { ...apiHeaders(key), Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}
async function writeActivity(url: string, key: string, userId: string, row: Record<string, unknown>) {
  await fetch(`${url}/rest/v1/activity_log`, {
    method: "POST",
    headers: { ...apiHeaders(key), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
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
