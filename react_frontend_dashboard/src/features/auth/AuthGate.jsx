import React from "react";

/** Auth disabled: passthrough component that always renders children. */
// PUBLIC_INTERFACE
export default function AuthGate({ children }) {
  return <>{children}</>;
}
