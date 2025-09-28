import { createClient } from "@supabase/supabase-js";

/**
 * Initializes and exports a singleton Supabase client for the frontend.
 * Reads public env variables injected at build time by React (prefixed with REACT_APP_).
 * Provides helpful console warnings if variables are missing to aid diagnostics.
 *
 * PUBLIC_INTERFACE
 * - export const supabase
 * - export const hasSupabaseConfig
 * - export function assertSupabaseConfigured()
 * - export function getEdgeFunctionsBaseUrl()
 *
 * Required environment variables (must be set in this container's .env by the orchestrator):
 * - REACT_APP_SUPABASE_URL  (e.g., https://<project-ref>.supabase.co)
 * - REACT_APP_SUPABASE_KEY  (anon public key)
 *
 * Notes:
 * - Do not hardcode credentials; request env values from the user/orchestrator.
 * - Ensure Supabase project CORS settings include this app's origin.
 * - Edge Functions will be invoked at: ${REACT_APP_SUPABASE_URL}/functions/v1/<function-name>
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Track configuration state for conditional rendering elsewhere
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// PUBLIC_INTERFACE
export function getEdgeFunctionsBaseUrl() {
  /** Returns the absolute base URL for Edge Functions, or null if not configured. */
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
}

// Provide explicit assertion to fail fast in dev if config is missing
// PUBLIC_INTERFACE
export function assertSupabaseConfigured() {
  /** Throws an Error if Supabase env vars are missing. */
  if (!hasSupabaseConfig) {
    const details = [
      "Supabase configuration missing.",
      "Please set the following in your .env and restart the dev server:",
      "  - REACT_APP_SUPABASE_URL=https://<project>.supabase.co",
      "  - REACT_APP_SUPABASE_KEY=<anon-public-key>",
    ].join("\n");
    throw new Error(details);
  }
}

if (!hasSupabaseConfig) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Missing configuration. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env. The app will show a helpful setup screen."
  );
}

/* PUBLIC_INTERFACE */
/**
 * Export a configured Supabase client instance for use across the app.
 * Note: In development without env vars, client will be created with placeholders.
 * Many requests will fail until env is provided, which is handled gracefully by callers.
 */
export const supabase = createClient(
  supabaseUrl || "about:blank",
  supabaseAnonKey || "missing-key"
);
