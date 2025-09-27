import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiBell } from "react-icons/fi";
import { Modal } from "./Modal";

/**
 * PUBLIC_INTERFACE
 */
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

  // Notifications modal open state
  const [notifOpen, setNotifOpen] = useState(false);

  // Sample notifications (replace with API later)
  const notifications = [
    {
      id: "n1",
      title: "Welcome to Cross-Cloud Manager",
      body: "You're all set. Link your cloud accounts to get started.",
      tone: "info",
    },
    {
      id: "n2",
      title: "Inventory Sync Completed",
      body: "We discovered 128 resources across AWS and Azure.",
      tone: "success",
    },
    {
      id: "n3",
      title: "Automation Tip",
      body: "Create a schedule to stop dev VMs after hours.",
      tone: "neutral",
    },
  ];

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
      <div className="user-badge" style={{ gap: 12, position: "relative", display: "flex", alignItems: "center" }}>
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
          onClick={() => setNotifOpen(true)}
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
        <span style={{ color: "var(--muted)", fontSize: 14, marginLeft: 4 }}>{userLabel}</span>
        <div
          className="avatar"
          title={userLabel}
          style={{ cursor: "default" }}
          aria-label="User avatar"
        >
          {initials}
        </div>
      </div>

      {/* Centered notifications modal */}
      <Modal
        title="Notifications"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        footer={<button className="btn" onClick={() => setNotifOpen(false)}>Close</button>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {notifications.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--muted)" }}>No notifications.</div>
          ) : (
            notifications.map((n) => (
              <article
                key={n.id}
                className="panel"
                style={{
                  borderRadius: 12,
                  background: "#FFFFFF",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="panel-body" style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          n.tone === "success" ? "#ECFDF5" :
                          n.tone === "info" ? "#EFF6FF" :
                          "#F3F4F6",
                        color:
                          n.tone === "success" ? "#065F46" :
                          n.tone === "info" ? "#1E40AF" :
                          "#374151",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {n.title}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text)", fontSize: 14, lineHeight: "20px" }}>{n.body}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
