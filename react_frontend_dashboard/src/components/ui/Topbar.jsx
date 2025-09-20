import React from "react";

// PUBLIC_INTERFACE
export default function Topbar({ onSearch }) {
  /** Minimal topbar containing search and static user badge. Auth removed. */
  const initials = "G";
  const userLabel = "Guest";

  return (
    <div className="topbar">
      <div className="search">
        <span role="img" aria-label="search">🔎</span>
        <input placeholder="Search resources, accounts, rules..." onChange={(e) => onSearch?.(e.target.value)} />
      </div>
      <div className="user-badge">
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{userLabel}</span>
        <div className="avatar" title={userLabel}>{initials}</div>
      </div>
    </div>
  );
}
