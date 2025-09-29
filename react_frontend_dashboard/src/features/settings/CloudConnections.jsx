import React, { useEffect, useState } from "react";
import AddCloudAccountModal from "../../components/ui/AddCloudAccountModal";
import { getLinkedAccounts, createLinkedAccount } from "../../services/api";
import { useToast } from "../../components/ui/Toast";

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
  const { show: showToast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const rows = await getLinkedAccounts();
      setAccounts(rows || []);
    } catch (e) {
      const reason = e?.message || "Failed to load accounts";
      showToast(`Failed to load accounts — ${reason}`, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // No cleanup needed: ToastProvider manages its own timers
    return () => {};
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
      showToast("Account linked successfully", { type: "success" });
      await load();
      setOpen(false);
    } catch (e) {
      const reason = mapErrorToMessage(e);
      const extra =
        e?.payload?.error ||
        (e?.status ? `HTTP ${e.status}` : null) ||
        (e?.url ? `URL: ${e.url}` : null);
      const msg = extra ? `Failed to link account — ${reason} (${extra})` : `Failed to link account — ${reason}`;
      showToast(msg, { type: "error", timeout: 5000 });
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
