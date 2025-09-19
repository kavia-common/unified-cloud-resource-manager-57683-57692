import React, { createContext, useContext, useMemo } from "react";

/**
 * Mock Auth context for unauthenticated demo mode.
 * Provides a default "Guest" user and no-op auth methods.
 */
const AuthContext = createContext({
  session: null,
  user: { id: "mock-user", email: "guest@example.com" },
  loading: false,
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
  const ctx = useContext(AuthContext);
  // Defensive fallback: if provider is missing, return a safe guest context
  if (!ctx) {
    return {
      session: null,
      user: { id: "mock-user", email: "guest@example.com" },
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
   * Provides a static mock auth context so the UI can render without gating.
   */
  const value = useMemo(
    () => ({
      session: null,
      user: { id: "mock-user", email: "guest@example.com" },
      loading: false,
      signInWithEmail: async (_e, _p) => ({ data: null, error: null }),
      signUpWithEmail: async (_e, _p) => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
