import React, { useEffect, useState } from "react";
import AddAccountMinimalModal from "../../components/ui/AddAccountMinimalModal";
import { getLinkedAccounts } from "../../services/api";
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

  function handleSaved(acc) {
    // Optimistically update local view; backend persistence can be added later.
    setAccounts((prev) => [acc, ...(prev || [])]);
    showToast("Account added locally. TODO: persist to Supabase.", { type: "success" });
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

      <AddAccountMinimalModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
