import React, { useEffect, useState } from "react";
import { getEdgeFunctionsBaseUrl, hasSupabaseConfig } from "../../services/supabaseClient";

// PUBLIC_INTERFACE
export default function DevConfigNotice() {
  /** Minimal notice shown when Supabase config is missing or not reachable. */
  const [reachable, setReachable] = useState(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    let canceled = false;

    async function checkReachability() {
      const base = getEdgeFunctionsBaseUrl();
      if (!base) {
        setReachable(false);
        setDetails("Missing REACT_APP_SUPABASE_URL.");
        return;
      }
      // Try a lightweight reachability check. If the project doesn't have /health,
      // a CORS error or 404 still proves the origin is contactable; network errors do not.
      try {
        const res = await fetch(`${base}/health`, { method: "GET", mode: "cors" });
        if (canceled) return;
        setReachable(true);
        setDetails(`Edge Functions base reachable: ${base} (HTTP ${res.status})`);
      } catch (e) {
        if (canceled) return;
        setReachable(false);
        setDetails(`Network error calling ${base}/health: ${e?.message || "Unknown error"}`);
      }
    }

    checkReachability();
    return () => { canceled = true; };
  }, []);

  if (hasSupabaseConfig && reachable !== false) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "(unknown-origin)";
  const baseUrl = getEdgeFunctionsBaseUrl() || "(unset)";

  return (
    <div style={{
      background: "#FEF2F2",
      color: "#7F1D1D",
      padding: "12px",
      border: "1px solid #FECACA",
      borderRadius: 8,
      margin: "12px",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Supabase configuration notice</div>
      <div className="text-sm" style={{ lineHeight: 1.4 }}>
        The app is running with a local data model. To enable cloud-backed features, set and verify these environment variables:
        <pre style={{
          background: "#fff",
          border: "1px solid #F3F4F6",
          padding: "8px",
          borderRadius: 6,
          overflow: "auto",
          marginTop: 8,
          marginBottom: 8,
          color: "#111827"
        }}>
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_KEY=YOUR_PUBLIC_ANON_KEY
        </pre>
        After updating .env, restart the app.
        <br />
        Also, in Supabase Dashboard:
        <ol style={{ margin: "8px 0 0 18px" }}>
          <li>Authentication → URL Configuration: add {origin} as Site URL.</li>
          <li>Authentication → URL Configuration → Additional Redirect URLs: add {origin}.</li>
          <li>Storage → CORS: add origin {origin}.</li>
          <li>Edge Functions: ensure your functions are deployed.</li>
        </ol>
        <div style={{ marginTop: 8 }}>
          Diagnostics:
          <ul style={{ margin: "6px 0 0 18px" }}>
            <li>hasSupabaseConfig: {String(hasSupabaseConfig)}</li>
            <li>Edge Functions base: {baseUrl}</li>
            <li>Reachable: {reachable === null ? "checking..." : String(reachable)}</li>
            {details ? <li>Details: {details}</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
