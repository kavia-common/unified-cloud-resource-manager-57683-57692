import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * supabase is a lazily-created client using environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 * If env vars are absent, supabase is null to avoid blocking the UI.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string | undefined;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * PUBLIC_INTERFACE
 * Returns true if Supabase configuration variables are present.
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}
