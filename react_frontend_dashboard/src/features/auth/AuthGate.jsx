import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

// PUBLIC_INTERFACE
export default function AuthGate({ children }) {
  /** Wraps protected content, rendering sign-in form when user is not authenticated. */
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  return user ? children : <AuthScreen />;
}

function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "signin") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
    } catch (error) {
      setErr(error.message || "Authentication failed");
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 20 }}>
      <div className="panel" style={{ width: 380 }}>
        <div className="panel-header">
          <div className="panel-title">{mode === "signin" ? "Sign in" : "Create account"}</div>
        </div>
        <div className="panel-body">
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Email</div>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Password</div>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </label>
            {err && <div className="badge error">Error: {err}</div>}
            <button className="btn primary" type="submit">{mode === "signin" ? "Sign in" : "Sign up"}</button>
          </form>
        </div>
        <div style={{ padding: 12, textAlign: "center", color: "var(--muted)" }}>
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button className="btn ghost" onClick={() => setMode("signup")}>Create one</button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button className="btn ghost" onClick={() => setMode("signin")}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
