import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";

/** Cloud account connection manager. Supports AWS and Azure entries. */
export default function CloudConnections() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ provider: "AWS", name: "", accountId: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    // Best-effort read (table might not exist yet in environment)
    const { data, error: err } = await supabase.from("cloud_accounts").select("*").order("created_at", { ascending: false });
    if (!err && Array.isArray(data)) setAccounts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "provider", label: "Provider" },
    { key: "name", label: "Name" },
    { key: "account_id", label: "Account / Subscription" },
    { key: "status", label: "Status", render: (v) => <span className={`badge ${v === "connected" ? "success" : ""}`}>{v || "unknown"}</span> },
    { key: "created_at", label: "Added" },
  ];

  async function addAccount(e) {
    e.preventDefault();
    setError("");
    const payload = {
      provider: form.provider,
      name: form.name,
      account_id: form.accountId,
      status: "connected",
    };
    const { error: err } = await supabase.from("cloud_accounts").insert(payload);
    if (err) {
      setError(err.message);
    } else {
      setOpenModal(false);
      setForm({ provider: "AWS", name: "", accountId: "" });
      load();
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Cloud Connections</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
          <button className="btn primary" onClick={() => setOpenModal(true)}>Connect Account</button>
        </div>
      </div>
      <div className="panel-body">
        <DataTable columns={columns} rows={accounts} emptyMessage="No cloud accounts linked yet." />
      </div>

      <Modal
        title="Connect Cloud Account"
        open={openModal}
        onClose={() => setOpenModal(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpenModal(false)}>Cancel</button>
            <button className="btn primary" onClick={addAccount}>Save</button>
          </>
        }
      >
        <form onSubmit={addAccount} style={{ display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Provider</div>
            <select
              className="select"
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            >
              <option>AWS</option>
              <option>Azure</option>
            </select>
          </label>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Friendly Name</div>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prod Account" />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Account ID / Subscription ID</div>
            <input className="input" value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} placeholder="123456789012 / xxxx-xxxx-xxxx" />
          </label>
          {error && <div className="badge error">Error: {error}</div>}
        </form>
      </Modal>
    </div>
  );
}
