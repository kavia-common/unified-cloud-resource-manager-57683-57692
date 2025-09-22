import React, { useState } from "react";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";

/** Cloud account connection manager. Supports AWS and Azure entries (local mock). */
export default function CloudConnections() {
  const [accounts, setAccounts] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ provider: "AWS", name: "", accountId: "" });

  const columns = [
    { key: "provider", label: "Provider" },
    { key: "name", label: "Name" },
    { key: "account_id", label: "Account / Subscription" },
    { key: "status", label: "Status", render: (v) => <span className={`badge ${v === "connected" ? "success" : ""}`}>{v || "unknown"}</span> },
    { key: "created_at", label: "Added" },
  ];

  function addAccount(e) {
    e?.preventDefault?.();
    setAccounts(prev => [
      {
        provider: form.provider,
        name: form.name,
        account_id: form.accountId,
        status: "connected",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setOpenModal(false);
    setForm({ provider: "AWS", name: "", accountId: "" });
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Cloud Connections</div>
        <div style={{ display: "flex", gap: 10 }}>
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
        </form>
      </Modal>
    </div>
  );
}
