import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiBell } from "react-icons/fi";
import { Popover } from "./Popover";

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

  // Notification popover state anchored to the bell button
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

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

        <span style={{ position: "relative", display: "inline-flex" }}>
          <button
            ref={bellRef}
            className="btn ghost"
            aria-label="View notifications"
            title="Notifications"
            aria-haspopup="dialog"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((v) => !v)}
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

          {/* Notification dropdown/panel */}
          <div style={{ position: "absolute", right: 0 }}>
            <Popover
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              anchorRef={bellRef}
              ariaLabel="Notifications"
            >
              <div
                className="panel"
                style={{
                  width: 340,
                  maxWidth: "calc(100vw - 24px)",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  className="panel-header"
                  style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}
                >
                  <span className="panel-title" style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                    Notifications
                  </span>
                </div>
                <div className="panel-body" style={{ padding: 12 }}>
                  {/* Cost Anomaly (Azure) item */}
                  <div
                    role="article"
                    aria-label="Cost Anomaly (Azure)"
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: "var(--surface)",
                    }}
                  >
                    {/* Left indicator */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        marginTop: 4,
                        background: "#EF4444",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ color: "var(--text)", fontSize: 13 }}>Cost Anomaly</strong>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#ffffff",
                            background: "#3B82F6",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontWeight: 600,
                          }}
                        >
                          Azure
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "var(--text)", fontSize: 13, lineHeight: "18px" }}>
                        Cost spike detected on Azure: +27% week-on-week
                      </p>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "#fff",
                            color: "var(--primary)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            // Integrate routing to costs tab if available
                            // e.g., navigate('/costs')
                            // eslint-disable-next-line no-console
                            console.log("View details clicked");
                            setNotifOpen(false);
                          }}
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid #FECACA",
                            background: "#fff",
                            color: "#EF4444",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            // Wire up snooze UX later; for now, close panel
                            // eslint-disable-next-line no-console
                            console.log("Snooze clicked");
                            setNotifOpen(false);
                          }}
                        >
                          Snooze
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Popover>
          </div>
        </span>

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
    </div>
  );
}
