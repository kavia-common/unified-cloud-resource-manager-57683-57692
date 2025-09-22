import { serve } from "https://deno.land/std/http/server.ts";

/**
 * link-account Edge Function
 *
 * Purpose:
 * - Securely link a user's cloud account for AWS, Azure, or GCP.
 * - Validates input payloads and stores:
 *   a) cloud_accounts: provider, name, account_id/project/subscription, status
 *   b) cloud_credentials: encrypted/sensitive fields stored server-side only
 *   c) activity_log entry for auditability
 *
 * Authentication:
 * - Requires a valid Supabase JWT (Authorization: Bearer <token>)
 * - Extracts user from Supabase JWT to associate the linked account.
 *
 * Routes:
 * - POST / (body: { provider, name, credentials... })
 *    For provider=AWS: { access_key_id, secret_access_key, account_id }
 *    For provider=Azure: { tenant_id, client_id, client_secret, subscription_id }
 *    For provider=GCP: { service_account_json (string) }
 *
 * Security Notes:
 * - Only minimal non-sensitive metadata is stored in cloud_accounts.
 * - Sensitive credentials are stored into cloud_credentials table (server-side only).
 * - In production, ensure RLS policies restrict row visibility by user_id.
 */
serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Validate auth header and decode user via Supabase JWT
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // Supabase supplies the user via JWT claims in the "sub" claim.
    // We rely on the "X-Client-Info" header or supabase functions' env to verify token if needed.
    // Here we trust Supabase's edge function gateway to validate token and pass "sub" claim.
    const userId = getUserIdFromJwt(jwt);
    if (!userId) {
      return jsonResponse({ error: "Invalid or missing user in token" }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    const { provider, name } = payload || {};
    if (!provider || !name) {
      return jsonResponse({ error: "provider and name are required" }, 400);
    }

    const now = new Date().toISOString();
    let account_id = "";
    let safeMetadata: Record<string, unknown> = {};
    let secretPayload: Record<string, unknown> = {};

    const p = String(provider).toUpperCase();
    if (p === "AWS") {
      const { access_key_id, secret_access_key, account_id: awsAccountId } = payload || {};
      if (!access_key_id || !secret_access_key || !awsAccountId) {
        return jsonResponse({ error: "Missing AWS credentials: access_key_id, secret_access_key, account_id" }, 400);
      }
      account_id = String(awsAccountId);
      safeMetadata = { key_prefix: maskKey(access_key_id) };
      secretPayload = {
        access_key_id,
        secret_access_key,
        account_id,
        linked_at: now,
      };
    } else if (p === "AZURE") {
      const { tenant_id, client_id, client_secret, subscription_id } = payload || {};
      if (!tenant_id || !client_id || !client_secret || !subscription_id) {
        return jsonResponse({ error: "Missing Azure credentials: tenant_id, client_id, client_secret, subscription_id" }, 400);
      }
      account_id = String(subscription_id);
      safeMetadata = { tenant_id: maskId(tenant_id), client_id: maskKey(client_id) };
      secretPayload = {
        tenant_id,
        client_id,
        client_secret,
        subscription_id,
        linked_at: now,
      };
    } else if (p === "GCP") {
      const { service_account_json } = payload || {};
      if (!service_account_json || typeof service_account_json !== "string") {
        return jsonResponse({ error: "Missing GCP credentials: service_account_json (stringified JSON)" }, 400);
      }
      let sa: any;
      try {
        sa = JSON.parse(service_account_json);
      } catch {
        return jsonResponse({ error: "Invalid GCP service account JSON" }, 400);
      }
      if (!sa.project_id || !sa.client_email || !sa.private_key) {
        return jsonResponse({ error: "GCP service account JSON missing project_id, client_email, or private_key" }, 400);
      }
      account_id = String(sa.project_id);
      safeMetadata = { client_email: sa.client_email };
      secretPayload = {
        service_account_json: sa,
        linked_at: now,
      };
    } else {
      return jsonResponse({ error: "Unsupported provider. Use AWS, Azure, or GCP." }, 400);
    }

    // Insert into DB using PostgREST calls (fetch) to Supabase rest endpoint
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // recommended for server-side auth
    // Prefer service role for secure writes that bypass RLS for initial insert, but
    // ensure you add safe RLS policies in DB for later reads.
    const adminKey = serviceRole || supabaseAnonKey;
    if (!supabaseUrl || !adminKey) {
      return jsonResponse({ error: "Server misconfigured: missing SUPABASE_URL or service key" }, 500);
    }

    // 1) Insert minimal metadata into cloud_accounts
    const accountInsert = await postgrestInsert(`${supabaseUrl}/rest/v1/cloud_accounts`, adminKey, {
      user_id: userId,
      provider: p,
      name,
      account_id,
      status: "connected",
      metadata: safeMetadata,
      created_at: now,
    });

    if (!accountInsert.ok) {
      const err = await accountInsert.text();
      return jsonResponse({ error: `Failed to insert cloud_accounts: ${err}` }, 500);
    }

    const insertedAccounts = await accountInsert.json().catch(() => []);
    const account = Array.isArray(insertedAccounts) && insertedAccounts[0] ? insertedAccounts[0] : null;
    const accountIdPk = account?.id;

    // 2) Insert secret credentials into cloud_credentials table
    const credsInsert = await postgrestInsert(`${supabaseUrl}/rest/v1/cloud_credentials`, adminKey, {
      user_id: userId,
      cloud_account_id: accountIdPk,
      provider: p,
      // Store encrypted/opaque secrets as JSONB; in production, consider vault or KMS integration
      secret: secretPayload,
      created_at: now,
    });
    if (!credsInsert.ok) {
      const err = await credsInsert.text();
      return jsonResponse({ error: `Failed to insert cloud_credentials: ${err}` }, 500);
    }

    // 3) Write an activity log entry
    await postgrestInsert(`${supabaseUrl}/rest/v1/activity_log`, adminKey, {
      actor: userId,
      type: "link_account",
      summary: `Linked ${p} account "${name}" (${account_id})`,
      status: "success",
      created_at: now,
    });

    return jsonResponse({
      message: "Account linked successfully",
      account: { id: accountIdPk, provider: p, name, account_id, status: "connected", metadata: safeMetadata },
    });
  } catch (e) {
    return jsonResponse({ error: e?.message || String(e) }, 500);
  }
});

/** Helper: JSON response with proper headers */
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Helper: very light masking to avoid echoing raw identifiers */
function maskKey(k: string) {
  if (!k) return "";
  const s = String(k);
  return s.length <= 4 ? "***" : s.slice(0, 4) + "****";
}
function maskId(id: string) {
  if (!id) return "";
  const s = String(id);
  return s.length <= 6 ? "***" : s.slice(0, 3) + "***" + s.slice(-3);
}

/**
 * Extract "sub" from JWT without verifying signature (gateway has verified it).
 * For informational association only.
 */
function getUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(padBase64(parts[1])));
    return payload?.sub || null;
  } catch {
    return null;
  }
}

function padBase64(base64: string) {
  return base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4);
}

/** PostgREST insert helper */
function postgrestInsert(url: string, key: string, row: Record<string, unknown>) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(row),
  });
}
