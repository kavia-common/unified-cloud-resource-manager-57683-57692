import React, { useState } from "react";
import { DataTable } from "../../components/ui/Table";
import AddCloudAccountModal from "../../components/ui/AddCloudAccountModal";

/** PUBLIC_INTERFACE
 * Cloud account connection manager. Integrates AddCloudAccountModal for adding accounts (frontend-only).
 * Ensures that after submitting valid credentials, the new account appears in the list below.
 */
export default function CloudConnections() {
  const [accounts, setAccounts] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const columns = [
    { key: "provider", label: "Provider" },
    { key: "name", label: "Name" },
    { key: "account_id", label: "Account / Subscription" },
    {
      key: "status",
      label: "Status",
      render: (v) => <span className={`badge ${v === "connected" ? "success" : ""}`}>{v || "unknown"}</span>,
    },
    { key: "created_at", label: "Added" },
  ];

  // PUBLIC_INTERFACE
  function handleAddAccount(payload) {
    /** Accepts payload from AddCloudAccountModal and appends a normalized account row. */
    const { provider, name, credentials } = payload || {};
    // Derive an account identifier for display (best-effort mock)
    let accountId = "";
    if (provider === "AWS") {
      accountId = credentials?.accessKeyId ? `AKIA…${String(credentials.accessKeyId).slice(-4)}` : "";
    } else if (provider === "Azure") {
      accountId = credentials?.subscriptionId || credentials?.tenantId || "";
    }
    const newRow = {
      provider,
      name,
      account_id: accountId,
      status: "connected",
      created_at: new Date().toISOString(),
    };
    setAccounts((prev) => [newRow, ...prev]);
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

      <AddCloudAccountModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        existingAccounts={accounts}
        onSubmit={(payload) => {
          handleAddAccount(payload);
          // The modal will reset and close itself after onSubmit via its handleClose
          setOpenModal(false);
        }}
      />
    </div>
  );
}
