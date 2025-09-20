import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabaseClient";

/**
 * Supabase-backed Auth context.
 * Exposes session, user, loading, and PUBLIC_INTERFACE methods for sign-in/up/out.
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** React hook to access the auth context */
  const ctx = useContext(AuthContext);
  // Defensive fallback: safe guest context if provider missing
  if (!ctx) {
    return {
      session: null,
      user: null,
      loading: false,
      signInWithEmail: async () => ({ data: null, error: null }),
      signUpWithEmail: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    };
  }
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Auth provider that listens to Supabase auth changes and provides auth methods.
   */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial session fetch and subscribe to changes
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session || null);
        setUser(data?.session?.user || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user || null);
    });

    init();

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // PUBLIC_INTERFACE
  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setSession(data?.session || null);
      setUser(data?.user || data?.session?.user || null);
    }
    return { data, error };
  }

  // PUBLIC_INTERFACE
  async function signUpWithEmail(email, password) {
    const emailRedirectTo = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    return { data, error };
  }

  // PUBLIC_INTERFACE
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
    }
    return { error };
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
