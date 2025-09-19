import React from "react";
import { useAuth } from "../../context/AuthContext";

// PUBLIC_INTERFACE
export default function Topbar({ onSearch }) {
  /** Minimal topbar containing search and user badge with sign-out. */
  const { user, signOut } = useAuth();
  const initials =
    user?.email
      ? user.email
          .split("@")[0]
          .split(/[.\-_]/)
          .slice(0, 2)
          .map((s) => s.charAt(0).toUpperCase())
          .join("") || "U"
      : "G";

  return (
    <div className="topbar">
      <div className="search">
        <span role="img" aria-label="search">🔎</span>
        <input placeholder="Search resources, accounts, rules..." onChange={(e) => onSearch?.(e.target.value)} />
      </div>
      <div className="user-badge">
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{user?.email || "Guest"}</span>
        <div className="avatar" title={user?.email || "Guest"}>{initials}</div>
        {user && (
          <button className="btn" onClick={() => signOut()} title="Sign out">
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
