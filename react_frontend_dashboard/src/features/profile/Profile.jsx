import React from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Profile page: shows user info and sign out action.
 */
export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Profile</div>
          <div />
        </div>
        <div className="panel-body" style={{ display: "grid", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Signed in as</div>
            <div style={{ fontWeight: 700 }}>{user?.email || user?.id}</div>
          </div>
          <div>
            <button className="btn" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
