import React, { createContext, useContext } from "react";

/** Authentication disabled: provide a static guest context. */
const AuthContext = createContext({
  session: null,
  user: null, // treat as unauthenticated guest
  loading: false,
  // PUBLIC_INTERFACE
  signInWithEmail: async () => {},
  // PUBLIC_INTERFACE
  signUpWithEmail: async () => {},
  // PUBLIC_INTERFACE
  signOut: async () => {},
});

// PUBLIC_INTERFACE
export function useAuth() {
  /** React hook to access the (disabled) auth context for compatibility. */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** No-op provider that supplies a guest auth context and does not gate UI. */
  const value = useContext(AuthContext);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
