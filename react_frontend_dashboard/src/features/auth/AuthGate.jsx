import React from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * AuthGate protects children if requireAuth is true. Renders the provided fallback if not authenticated.
 */
export default function AuthGate({ requireAuth = false, fallback = null, children }) {
  const { user, loading } = useAuth();

  if (!requireAuth) return children;

  if (loading) {
    return (
      <div className="panel" style={{ padding: 24 }}>
        <div className="panel-title">Loading authentication state…</div>
        <div style={{ marginTop: 8, color: 'var(--muted)' }}>
          Connecting to Supabase...
        </div>
      </div>
    );
  }

  // Show explicit message if Supabase isn't configured
  if (!window._supabaseConfigured) {
    return (
      <div className="panel" style={{ padding: 24, color: 'var(--error)' }}>
        <div className="panel-title">Configuration Error</div>
        <div style={{ marginTop: 8 }}>
          Supabase environment variables are not properly configured.
          Please check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.
        </div>
      </div>
    );
  }

  if (!user) return fallback;
  return children;
}
