import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabaseClient";

/**
 * Supabase Auth provider with email/password support.
 * Persists session and exposes auth helpers.
 */
const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  // PUBLIC_INTERFACE
  signInWithEmail: async (_email, _password) => ({ data: null, error: null }),
  // PUBLIC_INTERFACE
  signUpWithEmail: async (_email, _password) => ({ data: null, error: null }),
  // PUBLIC_INTERFACE
  signOut: async () => ({ error: null }),
});

// PUBLIC_INTERFACE
export function useAuth() {
  /** React hook to access the auth context */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Provides session-aware auth context using Supabase.
   * Uses onAuthStateChange to update session.
   */
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data, error } = await supabase.auth.getSession();
      if (!error && mounted) {
        setSession(data.session || null);
      }
      setLoading(false);
    }
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
