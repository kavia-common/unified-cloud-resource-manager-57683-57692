import React, { useEffect, useState } from "react";
import AddCloudAccountModal from "../../components/ui/AddCloudAccountModal";
import { getLinkedAccounts, createLinkedAccount } from "../../services/api";

/**
 * PUBLIC_INTERFACE
 */
export default function CloudConnections() {
  /**
   * Cloud connections settings page.
   * - Lists linked accounts from DB.
   * - Opens modal to add a new account and persists via Edge Function.
   * - Shows detailed success/error toasts.
   */
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(type, message, details) {
    const text = details ? `${message} — ${details}` : message;
    setToast({ type, message: text });
    // Auto-dismiss after 5s
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 5000);
  }

  async function load() {
    setLoading(true);
    try {
      const rows = await getLinkedAccounts();
      setAccounts(rows || []);
    } catch (e) {
      showToast("error", "Failed to load accounts", e?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Cleanup timer on unmount
    return () => {
      if (showToast._t) window.clearTimeout(showToast._t);
    };
  }, []);

  function mapErrorToMessage(err) {
    if (!err) return "Unknown error";
    if (err.code === "NETWORK_ERROR") {
      return "Network error: could not reach Supabase Edge Function. Check connectivity, CORS, and URL.";
    }
    if (err.code === "UNAUTHORIZED" || err.status === 401) {
      return "Unauthorized: please sign in again.";
    }
    if (err.code === "FORBIDDEN" || err.status === 403) {
      return "Forbidden: you do not have access.";
    }
    if (err.code === "NOT_FOUND" || err.status === 404) {
      return "Endpoint not found: ensure the Edge Function is deployed and enabled.";
    }
    return err?.message || "Request failed";
  }

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const result = await createLinkedAccount(payload);
      showToast("success", "Account linked successfully");
      await load();
      setOpen(false);
    } catch (e) {
      const reason = mapErrorToMessage(e);
      const extra =
        e?.payload?.error ||
        (e?.status ? `HTTP ${e.status}` : null) ||
        (e?.url ? `URL: ${e.url}` : null);
      showToast("error", "Failed to link account", extra ? `${reason} (${extra})` : reason);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Cloud Connections</h2>
        <button className="btn primary" onClick={() => setOpen(true)} aria-label="Add Cloud Account">
          Add Account
        </button>
      </div>

      {toast && (
        <div
          className={`toast ${toast.type}`}
          role="alert"
          aria-live="assertive"
          style={{ marginBottom: 12 }}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="text-xs" style={{ color: "var(--muted)" }}>No linked accounts yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {accounts.map((acc) => (
            <div key={acc.id} className="panel" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{acc.name}</div>
                <div className="badge" aria-label={`Provider ${acc.provider}`}>{acc.provider}</div>
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {acc.account_id} · {new Date(acc.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCloudAccountModal
        open={open}
        onClose={() => setOpen(false)}
        existingAccounts={accounts}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
