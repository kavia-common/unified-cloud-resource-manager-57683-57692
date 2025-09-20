import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Minimalist sign-in/up form for email/password authentication via Supabase.
 */
export default function SignIn() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) setMessage(error.message);
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) setMessage(error.message);
        else setMessage("Sign-up successful. Check your email for confirmation.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
      <div className="panel" style={{ width: 380, maxWidth: "92vw" }}>
        <div className="panel-header">
          <div className="panel-title">{mode === "signin" ? "Sign in" : "Create account"}</div>
        </div>
        <div className="panel-body">
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Email</div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Password</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {message && <div className="badge" style={{ whiteSpace: "pre-wrap" }}>{message}</div>}
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? (mode === "signin" ? "Signing in..." : "Signing up...") : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button className="btn ghost" onClick={() => setMode("signup")} type="button">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="btn ghost" onClick={() => setMode("signin")} type="button">
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
