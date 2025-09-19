import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Wraps the app and displays a minimalist auth screen until user is signed in.
 */
export default function AuthGate({ children }) {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e?.preventDefault?.();
    setErr("");
    setBusy(true);
    try {
      const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
      const { error } = await fn(email, password);
      if (error) setErr(error.message || "Authentication error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--muted)" }}>
        Loading...
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--bg)", padding: 20 }}>
      <div className="panel" style={{ width: 420, maxWidth: "94vw" }}>
        <div className="panel-header">
          <div className="panel-title">Sign {mode === "signin" ? "in" : "up"}</div>
          <div className="badge">Pure White</div>
        </div>
        <div className="panel-body" style={{ display: "grid", gap: 12 }}>
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Email</div>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Password</div>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {err && <div className="badge error">Error: {err}</div>}
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button className="btn ghost" onClick={() => setMode("signup")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="btn ghost" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
