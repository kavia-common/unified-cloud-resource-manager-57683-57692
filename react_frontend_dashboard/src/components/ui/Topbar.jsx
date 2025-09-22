import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// PUBLIC_INTERFACE
export default function Topbar({ onSearch }) {
  /** Minimal topbar containing search and user badge. Shows auth user if available. */
  const { user } = useAuth();
  const userLabel = user?.email || (user?.id ? `${String(user.id).slice(0, 6)}…` : "Guest");
  const initials = user?.email
    ? user.email
        .split("@")[0]
        .split(/[._-]/)
        .map((s) => s[0]?.toUpperCase?.() || "")
        .slice(0, 2)
        .join("") || "U"
    : "G";
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="search">
        <span role="img" aria-label="search">🔎</span>
        <input placeholder="Search resources, accounts, rules..." onChange={(e) => onSearch?.(e.target.value)} />
      </div>
      <div className="user-badge">
        <button className="btn ghost" onClick={() => navigate("/profile")}>Profile</button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{userLabel}</span>
        <div className="avatar" title={userLabel}>{initials}</div>
      </div>
    </div>
  );
}
