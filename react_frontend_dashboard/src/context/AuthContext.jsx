import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase, { getEmailRedirectTo } from "../lib/supabaseClient";

const AuthCtx = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Provides session, user, loading and auth methods through React context. */
  return useContext(AuthCtx) || {
    session: null,
    user: null,
    loading: false,
    signInWithEmail: async () => ({ data: null, error: { message: "Auth not initialized" } }),
    signUpWithEmail: async () => ({ data: null, error: { message: "Auth not initialized" } }),
    signInWithGoogle: async () => ({ data: null, error: { message: "Auth not initialized" } }),
    signOut: async () => ({ error: { message: "Auth not initialized" } }),
  };
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * Manages Supabase session state and exposes sign-in/up/out methods.
   * Uses emailRedirectTo from window.location.origin.
   */
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial session fetch
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();

    // Subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => {
      try {
        subscription?.subscription?.unsubscribe?.();
        subscription?.unsubscribe?.();
      } catch {
        // ignore stub mismatch
      }
      mounted = false;
    };
  }, []);

  async function signInWithEmail({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signUpWithEmail({ email, password }) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
      },
    });
  }

  async function signInWithGoogle() {
    const redirectTo = getEmailRedirectTo();
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
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
      signInWithGoogle,
      signOut,
    }),
    [session, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
