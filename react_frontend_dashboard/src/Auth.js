import { useState } from "react";
import { supabase } from "./services/supabaseClient";

/**
 * PUBLIC_INTERFACE
 * Simple authentication form for email/password and OAuth.
 */
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const signInWithEmail = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const signUpWithEmail = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <h2>Login</h2>
      <form onSubmit={signInWithEmail}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
        />
        <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
      </form>

      <h2>Sign Up</h2>
      <form onSubmit={signUpWithEmail}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
        />
        <button type="submit" disabled={busy}>{busy ? "Submitting..." : "Sign Up"}</button>
      </form>

      <hr />
      <button onClick={signInWithGoogle} disabled={busy}>
        {busy ? "Please wait..." : "Sign in with Google"}
      </button>

      {err && (
        <div style={{ marginTop: 12, color: "#b91c1c" }}>
          {err}
        </div>
      )}
    </div>
  );
}
