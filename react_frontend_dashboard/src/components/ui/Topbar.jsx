import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiBell } from "react-icons/fi";

// PUBLIC_INTERFACE
export default function Topbar({ onSearch }) {
  /** Minimal topbar containing search, mail + bell icons, and user badge. */
  const { user } = useAuth();
  const userLabel = user?.email || (user?.id ? `${String(user.id).slice(0, 6)}…` : "Guest");
  const initials =
    user?.email
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
        <input
          placeholder="Search resources, accounts, rules..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      {/* Right side actions: mail + notifications + user avatar */}
      <div className="user-badge" style={{ gap: 12 }}>
        {/* Icons use Pure White subtle button styling */}
        <button
          className="btn ghost"
          aria-label="Open inbox"
          title="Inbox"
          style={{
            padding: 6,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "#fff",
            boxShadow: "var(--shadow)",
          }}
        >
          <FiMail size={18} color="var(--primary)" aria-hidden="true" />
        </button>
        <button
          className="btn ghost"
          aria-label="View notifications"
          title="Notifications"
          style={{
            padding: 6,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "#fff",
            boxShadow: "var(--shadow)",
          }}
        >
          <FiBell size={18} color="var(--primary)" aria-hidden="true" />
        </button>

        {/* Keep user identity compact and minimalist */}
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{userLabel}</span>
        <div
          className="avatar"
          title={userLabel}
          onClick={() => navigate("/profile")}
          style={{ cursor: "pointer" }}
          aria-label="Open profile"
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
