import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

/** Authentication context using Supabase session management. */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** React hook to access the authenticated user and auth functions. */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides Supabase auth session, user and auth methods to children. */
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

  // PUBLIC_INTERFACE
  const signInWithEmail = async (email, password) => {
    /** Sign in using email and password. */
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // PUBLIC_INTERFACE
  const signUpWithEmail = async (email, password) => {
    /** Sign up new user; sets emailRedirectTo using SITE_URL if provided downstream. */
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
  };

  // PUBLIC_INTERFACE
  const signOut = async () => {
    /** Sign out current user. */
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
