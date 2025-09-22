import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Minimal login + signup panel using Supabase Auth: email/password.
 */
export default function Login({ onSuccess }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleEmailAuth(e) {
    e?.preventDefault?.();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail({ email, password });
        if (error) setMsg(error.message);
        else onSuccess?.();
      } else {
        const { error } = await signUpWithEmail({ email, password });
        if (error) setMsg(error.message);
        else setMsg("Check your inbox to confirm your email.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 420, margin: "40px auto" }}>
      <div className="panel-header">
        <div className="panel-title">{mode === "signin" ? "Sign in" : "Create account"}</div>
        <div />
      </div>
      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        <form onSubmit={handleEmailAuth} style={{ display: "grid", gap: 10 }}>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {msg && <div className={`badge ${msg.toLowerCase().includes("check your inbox") ? "success" : "error"}`}>{msg}</div>}
          <button className="btn primary" disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
          <button
            className="btn ghost"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMsg("");
            }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
