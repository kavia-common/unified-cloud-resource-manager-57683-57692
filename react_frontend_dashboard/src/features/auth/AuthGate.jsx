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
        <div className="panel-title">Loading…</div>
      </div>
    );
  }
  if (!user) return fallback;
  return children;
}
