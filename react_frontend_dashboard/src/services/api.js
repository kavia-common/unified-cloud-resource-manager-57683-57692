/**
 * Centralized API service for Supabase interactions and Edge Functions.
 * PUBLIC_INTERFACE exports are documented for use across the app.
 */
import { supabase } from '../services/supabaseClient';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
// Use absolute URL for Edge Functions to avoid relative-path failures in preview/build setups.
const EDGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '/functions/v1';

// Helpers
async function callEdgeFunction(name, method = 'POST', body = null, signal) {
  // Attach Authorization header with the current session access token.
  // Supabase Edge Functions require a valid JWT for user-scoped operations.
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token || null;

  const url = `${EDGE_BASE}/${name}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const options = {
    method,
    headers,
    signal,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    const err = new Error(`Network error while calling ${name}: ${networkErr?.message || 'Failed to reach server'}`);
    err.code = 'NETWORK_ERROR';
    err.cause = networkErr;
    throw err;
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg =
      json?.error ||
      (res.status === 401
        ? 'Unauthorized (401): Please sign in again.'
        : res.status === 403
        ? 'Forbidden (403): You do not have access.'
        : res.status === 404
        ? 'Not found (404): The endpoint is unavailable.'
        : res.statusText || 'Request failed');
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    err.url = url;
    err.code =
      res.status === 401
        ? 'UNAUTHORIZED'
        : res.status === 403
        ? 'FORBIDDEN'
        : res.status === 404
        ? 'NOT_FOUND'
        : 'HTTP_ERROR';
    throw err;
  }
  return json;
}

// PUBLIC_INTERFACE
export async function loginWithEmail(email, password) {
  /** Log in a user via email/password using Supabase Auth. Returns { user, session }. */
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function signUpWithEmail(email, password, siteUrl) {
  /**
   * Sign up a user via Supabase Auth with email/password.
   * emailRedirectTo must be set from SITE_URL env configured externally.
   */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl,
    },
  });
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function logout() {
  /** Logs out the current user session. */
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

// PUBLIC_INTERFACE
export async function getCurrentUser() {
  /** Returns the current authenticated user (or null). */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user || null;
}

// PUBLIC_INTERFACE
export async function linkAwsAccount(payload, signal) {
  /**
   * Triggers AWS account linking flow via Edge Function 'link-account'.
   * payload: { provider: 'aws', accountId, roleArn, externalId }
   */
  return callEdgeFunction('link-account', 'POST', payload, signal);
}

// PUBLIC_INTERFACE
export async function linkAzureAccount(payload, signal) {
  /**
   * Triggers Azure account linking flow via Edge Function 'link-account'.
   * payload: { provider: 'azure', subscriptionId, tenantId, clientId, clientSecret }
   */
  return callEdgeFunction('link-account', 'POST', payload, signal);
}

// PUBLIC_INTERFACE
export async function discoverResources({ providers = ['aws', 'azure'] }, signal) {
  /**
   * Discovers multi-cloud resources via mock functions or actual providers.
   * Returns: { resources: [ ... ] }
   */
  return callEdgeFunction('mock-aws', 'POST', { action: 'discover', providers }, signal);
}

// PUBLIC_INTERFACE
export async function fetchInventory({ filter = {}, page = 1, pageSize = 20 }, signal) {
  /** Returns inventory list using cached DB or on-demand discovery. */
  return callEdgeFunction('mock-aws', 'POST', { action: 'inventory', filter, page, pageSize }, signal);
}

// PUBLIC_INTERFACE
export async function fetchCosts({ range = '30d', groupBy = 'service' }, signal) {
  /** Returns cost data aggregation for charts/tables. */
  return callEdgeFunction('mock-azure', 'POST', { action: 'costs', range, groupBy }, signal);
}

// PUBLIC_INTERFACE
export async function controlResource({ provider, resourceId, operation, params = {} }, signal) {
  /**
   * Performs lifecycle operations: start | stop | scale on a resource.
   * Returns the operation result and enqueues audit trail.
   */
  return callEdgeFunction('queue-processor', 'POST', { provider, resourceId, operation, params }, signal);
}

// PUBLIC_INTERFACE
export async function fetchRecommendations({ scope = 'all' }, signal) {
  /** Returns AI/ML recommendations from Edge Function. */
  return callEdgeFunction('recommendations', 'POST', { scope }, signal);
}

// PUBLIC_INTERFACE
export async function upsertAutomationRule(rule, signal) {
  /**
   * Upserts an automation rule into DB via Edge Function.
   * rule: { id?, name, conditions, actions, enabled }
   */
  return callEdgeFunction('automation-enforcer', 'POST', { action: 'upsert', rule }, signal);
}

// PUBLIC_INTERFACE
export async function listAutomationRules(signal) {
  /** Lists automation rules for the user. */
  return callEdgeFunction('automation-enforcer', 'POST', { action: 'list' }, signal);
}

// PUBLIC_INTERFACE
export async function fetchActivity({ page = 1, pageSize = 25 }, signal) {
  /** Returns activity history (audits, operations). */ 
  return callEdgeFunction('queue-processor', 'POST', { action: 'activity', page, pageSize }, signal);
}

// PUBLIC_INTERFACE
export async function getLinkedAccounts(signal) {
  /**
   * Gets linked accounts for current user from DB (direct PostgREST via supabase-js).
   * Requires RLS policy allowing user_id = auth.uid() for select.
   * Returns array of { id, provider, name, account_id, status, metadata, created_at }
   */
  const { data, error } = await supabase
    .from('cloud_accounts')
    .select('id, provider, name, account_id, status, metadata, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// PUBLIC_INTERFACE
export async function createLinkedAccount({ provider, name, credentials }) {
  /**
   * Creates a linked account via Edge Function to store secrets securely.
   * - AWS credentials: { accessKeyId, secretAccessKey, accountId }
   * - Azure credentials: { tenantId, clientId, clientSecret, subscriptionId }
   * Returns: { account: { id, provider, name, account_id, status, metadata } }
   */
  const p = String(provider || '').toUpperCase();
  let body = { provider: p, name };
  if (p === 'AWS') {
    body = {
      ...body,
      access_key_id: credentials?.accessKeyId,
      secret_access_key: credentials?.secretAccessKey,
      account_id: credentials?.accountId || credentials?.accessKeyId?.slice(0, 12) || '',
    };
  } else if (p === 'AZURE') {
    body = {
      ...body,
      tenant_id: credentials?.tenantId,
      client_id: credentials?.clientId,
      client_secret: credentials?.clientSecret,
      subscription_id: credentials?.subscriptionId,
    };
  } else if (p === 'GCP') {
    body = {
      ...body,
      service_account_json: credentials?.serviceAccountJson,
    };
  }
  const res = await callEdgeFunction('link-account', 'POST', body);
  return res;
}
