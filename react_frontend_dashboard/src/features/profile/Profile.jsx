import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";

/**
 * PUBLIC_INTERFACE
 * Profile page: shows user info, allows sign out, and manages linked cloud accounts,
 * including GCP service account JSON upload (paste) flow.
 */
export default function Profile() {
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [provider, setProvider] = useState("AWS");
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [gcpJson, setGcpJson] = useState("");
  const [error, setError] = useState("");

  async function loadAccounts() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("cloud_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!err && Array.isArray(data)) setAccounts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const columns = [
    { key: "provider", label: "Provider" },
    { key: "name", label: "Name" },
    { key: "account_id", label: "Account / Project" },
    { key: "status", label: "Status", render: (v) => <span className={`badge ${v === "connected" ? "success" : ""}`}>{v || "unknown"}</span> },
    { key: "created_at", label: "Added" },
  ];

  async function saveAccount(e) {
    e?.preventDefault?.();
    setError("");
    try {
      let payload = {
        provider,
        name,
        account_id: accountId,
        status: "connected",
      };

      if (provider === "GCP") {
        // Validate pasted JSON
        try {
          const parsed = JSON.parse(gcpJson || "{}");
          if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
            throw new Error("Invalid GCP service account JSON: missing fields.");
          }
          payload.account_id = parsed.project_id;
          // Store minimal reference to service account; in production, do secure storage server-side
          payload.metadata = { client_email: parsed.client_email };
        } catch (e2) {
          setError(e2.message || "Invalid JSON");
          return;
        }
      }

      const { error: err } = await supabase.from("cloud_accounts").insert(payload);
      if (err) {
        setError(err.message);
      } else {
        setOpenModal(false);
        setProvider("AWS");
        setName("");
        setAccountId("");
        setGcpJson("");
        loadAccounts();
      }
    } catch (e3) {
      setError(e3.message || "Failed to save");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Profile</div>
          <div />
        </div>
        <div className="panel-body" style={{ display: "grid", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Signed in as</div>
            <div style={{ fontWeight: 700 }}>{user?.email || user?.id}</div>
          </div>
          <div>
            <button className="btn" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Linked Cloud Accounts</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={loadAccounts} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button className="btn primary" onClick={() => setOpenModal(true)}>
              Link Account
            </button>
          </div>
        </div>
        <div className="panel-body">
          <DataTable columns={columns} rows={accounts} emptyMessage="No linked accounts yet." />
        </div>
      </div>

      <Modal
        title="Link Cloud Account"
        open={openModal}
        onClose={() => setOpenModal(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpenModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={saveAccount}>
              Save
            </button>
          </>
        }
      >
        <form onSubmit={saveAccount} style={{ display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Provider</div>
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option>AWS</option>
              <option>Azure</option>
              <option>GCP</option>
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Friendly Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prod Account" />
          </label>

          {provider !== "GCP" && (
            <label>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                Account ID / Subscription ID
              </div>
              <input
                className="input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="123456789012 / xxxx-xxxx-xxxx"
              />
            </label>
          )}

          {provider === "GCP" && (
            <>
              <div className="badge" style={{ alignSelf: "start" }}>
                Paste your GCP service account JSON key (project-level, least privilege).
              </div>
              <textarea
                className="input"
                rows={8}
                value={gcpJson}
                onChange={(e) => setGcpJson(e.target.value)}
                placeholder='{"type":"service_account","project_id":"my-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n..."}'
              />
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                For security, store credentials server-side in production. This demo only stores minimal metadata.
              </div>
            </>
          )}

          {error && <div className="badge error">Error: {error}</div>}
        </form>
      </Modal>
    </div>
  );
}
