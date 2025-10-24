import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

/**
 * Authentication context backed by Supabase (lazy-initialized).
 * Exposes useAuth() and AuthProvider to the rest of the app.
 */
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

  // Initial session fetch + subscription
  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();
    if (!client) {
      // No Supabase configured; run in auth-less mode
      setLoading(false);
      return () => {};
    }

    async function init() {
      try {
        const { data } = await client.auth.getSession();
        if (!mounted) return;
        setSession(data?.session || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();

    const { data: subscription } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => {
      try {
        subscription?.subscription?.unsubscribe?.();
        subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
      mounted = false;
    };
  }, []);

  async function signInWithEmail({ email, password }) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Auth not initialized" } };
    return client.auth.signInWithPassword({ email, password });
  }

  async function signUpWithEmail({ email, password }) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Auth not initialized" } };
    return client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    const client = getSupabaseClient();
    if (!client) return { error: { message: "Auth not initialized" } };
    const { error } = await client.auth.signOut();
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

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
