import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { linkCloudAccount } from "../../lib/linkAccountApi";

/**
 * PUBLIC_INTERFACE
 * Profile page: shows user info, allows sign out, and manages linked cloud accounts,
 * including GCP service account JSON upload (paste) flow.
 * Now uses secure Supabase Edge Function "link-account" to store credentials server-side.
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
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [azureTenantId, setAzureTenantId] = useState("");
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      const prov = String(provider).toUpperCase();
      if (!name) {
        setError("Please enter a friendly name.");
        return;
      }

      if (prov === "AWS") {
        if (!awsAccessKey || !awsSecretKey || !accountId) {
          setError("AWS requires Access Key ID, Secret Access Key, and Account ID.");
          return;
        }
        const { error } = await linkCloudAccount({
          provider: "AWS",
          name,
          credentials: {
            access_key_id: awsAccessKey,
            secret_access_key: awsSecretKey,
            account_id: accountId,
          },
        });
        if (error) {
          setError(error.message || "Failed to link AWS account");
          return;
        }
      } else if (prov === "AZURE") {
        if (!azureTenantId || !azureClientId || !azureClientSecret || !accountId) {
          setError("Azure requires Tenant ID, Client ID, Client Secret, and Subscription ID.");
          return;
        }
        const { error } = await linkCloudAccount({
          provider: "Azure",
          name,
          credentials: {
            tenant_id: azureTenantId,
            client_id: azureClientId,
            client_secret: azureClientSecret,
            subscription_id: accountId,
          },
        });
        if (error) {
          setError(error.message || "Failed to link Azure account");
          return;
        }
      } else if (prov === "GCP") {
        if (!gcpJson) {
          setError("Please paste your GCP service account JSON.");
          return;
        }
        // Basic sanity check client-side
        try {
          const parsed = JSON.parse(gcpJson);
          if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
            setError("Invalid GCP service account JSON: missing project_id, client_email, or private_key.");
            return;
          }
        } catch {
          setError("Invalid JSON format.");
          return;
        }
        const { error } = await linkCloudAccount({
          provider: "GCP",
          name,
          credentials: {
            service_account_json: gcpJson,
          },
        });
        if (error) {
          setError(error.message || "Failed to link GCP account");
          return;
        }
      } else {
        setError("Unsupported provider.");
        return;
      }

      // Reset and refresh
      setOpenModal(false);
      setProvider("AWS");
      setName("");
      setAccountId("");
      setGcpJson("");
      setAwsAccessKey("");
      setAwsSecretKey("");
      setAzureTenantId("");
      setAzureClientId("");
      setAzureClientSecret("");
      loadAccounts();
    } catch (e3) {
      setError(e3.message || "Failed to save");
    } finally {
      setBusy(false);
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
            <button className="btn primary" onClick={saveAccount} disabled={busy}>
              {busy ? "Saving…" : "Save"}
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

          {provider === "AWS" && (
            <>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Account ID</div>
                <input
                  className="input"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="123456789012"
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Access Key ID</div>
                <input
                  className="input"
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                  placeholder="AKIA..."
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Secret Access Key</div>
                <input
                  className="input"
                  type="password"
                  value={awsSecretKey}
                  onChange={(e) => setAwsSecretKey(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </>
          )}

          {provider === "Azure" && (
            <>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Subscription ID</div>
                <input
                  className="input"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Tenant ID</div>
                <input
                  className="input"
                  value={azureTenantId}
                  onChange={(e) => setAzureTenantId(e.target.value)}
                  placeholder="Tenant GUID"
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Client ID</div>
                <input
                  className="input"
                  value={azureClientId}
                  onChange={(e) => setAzureClientId(e.target.value)}
                  placeholder="App Registration Client ID"
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Client Secret</div>
                <input
                  className="input"
                  type="password"
                  value={azureClientSecret}
                  onChange={(e) => setAzureClientSecret(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </>
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
                placeholder='{"type":"service_account","project_id":"my-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n..."}'
              />
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Credentials are sent to the secure Edge Function and stored server-side only.
              </div>
            </>
          )}

          {error && <div className="badge error">Error: {error}</div>}
        </form>
      </Modal>
    </div>
  );
}
