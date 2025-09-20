import React from "react";

/**
 * AuthContext removed: authentication is no longer required.
 * This file provides no-op PUBLIC_INTERFACE hooks to keep imports safe.
 */

// PUBLIC_INTERFACE
export function useAuth() {
  /** Returns a static guest session; all methods are no-ops. */
  return {
    session: null,
    user: null,
    loading: false,
    signInWithEmail: async () => ({ data: null, error: null }),
    signUpWithEmail: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  };
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Pass-through provider kept for compatibility; no state management. */
  return <>{children}</>;
}
