import { createClient } from "@supabase/supabase-js";

/**
 * Initializes and exports a singleton Supabase client for the frontend.
 * Reads public env variables injected at build time by React (prefixed with REACT_APP_).
 * Provides helpful console warnings if variables are missing to aid diagnostics.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Missing configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env file."
  );
}

/* PUBLIC_INTERFACE */
/** Export a configured Supabase client instance for use across the app. */
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);
