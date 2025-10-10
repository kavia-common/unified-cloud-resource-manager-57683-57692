import React from 'react';
import supabase, { getSupabaseClient } from '../../lib/supabaseClient';

/**
 * DevConfigNotice shows a non-blocking banner in development when Supabase envs are missing.
 * It relies on supabaseClient module to detect configuration state.
 */
export default function DevConfigNotice() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  const missing = !url || !key;

  if (!missing) return null;

  return (
    <div
      style={{
        padding: '8px 12px',
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
        borderRadius: 6,
        marginBottom: 12,
        fontSize: 13,
      }}
      role="note"
      aria-live="polite"
    >
      <strong>Configuration notice:</strong> Supabase environment variables are not set.
      Please configure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env.
    </div>
  );
}

// Ensure the imports above do not tree-shake away default/named exports.
void supabase;
void getSupabaseClient;
