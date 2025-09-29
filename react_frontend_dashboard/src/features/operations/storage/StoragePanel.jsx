import React, { useMemo, useState } from "react";
import { DataTable } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

/**
 * PUBLIC_INTERFACE
 */
export default function StoragePanel() {
  /**
   * Manage object storage buckets/containers: create/delete, toggle public/private, stats, empty.
   */
  const toast = useToast();
  const [buckets, setBuckets] = useState([
    { id: "bkt-logs", name: "prod-logs", provider: "aws", type: "s3", region: "us-east-1", public: false, objects: 124000, size_gb: 320.4, est_cost: 7.2 },
    { id: "cont-media", name: "media", provider: "azure", type: "blob", region: "eastus", public: true, objects: 7600, size_gb: 82.1, est_cost: 2.8 },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "aws", region: "", public: false });

  function resetForm() { setForm({ name: "", provider: "aws", region: "", public: false }); }

  // PUBLIC_INTERFACE
  function createBucket() {
    if (!form.name) return toast.info("Name is required");
    const id = `${form.provider}-${form.name}`;
    setBuckets(prev => [{ id, name: form.name, provider: form.provider, type: form.provider === "aws" ? "s3" : "blob", region: form.region || (form.provider === "aws" ? "us-east-1" : "eastus"), public: !!form.public, objects: 0, size_gb: 0, est_cost: 0 }, ...prev]);
    toast.success("Bucket/Container created");
    setShowCreate(false);
    // TODO: Call backend to create bucket/container and set policy
  }

  // PUBLIC_INTERFACE
  function togglePublic(id) {
    setBuckets(prev => prev.map(b => (b.id === id ? { ...b, public: !b.public } : b)));
    toast.info("Access updated");
    // TODO: backend call to update policy
  }

  // PUBLIC_INTERFACE
  function emptyBucket(id) {
    setBuckets(prev => prev.map(b => (b.id === id ? { ...b, objects: 0, size_gb: 0 } : b)));
    toast.success("Bucket emptied");
    // TODO: backend call to delete all objects with safeguards
  }

  // PUBLIC_INTERFACE
  function deleteBucket(id) {
    setBuckets(prev => prev.filter(b => b.id !== id));
    toast.error("Bucket deleted");
    // TODO: backend deletion with force flag if empty
  }

  const columns = useMemo(() => [
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "type", label: "Type" },
    { key: "region", label: "Region" },
    { key: "public", label: "Access", render: v => (v ? "Public" : "Private") },
    { key: "objects", label: "Objects" },
    { key: "size_gb", label: "Size (GB)", render: v => (v ? Number(v).toFixed(1) : "0.0") },
    { key: "est_cost", label: "Est. Cost ($)", render: v => (v ? Number(v).toFixed(2) : "0.00") },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn ghost" onClick={() => togglePublic(r.id)}>{r.public ? "Make Private" : "Make Public"}</button>
          <button className="btn ghost" onClick={() => emptyBucket(r.id)}>Empty</button>
          <button className="btn" style={{ borderColor: "var(--border)", color: "#EF4444" }} onClick={() => deleteBucket(r.id)}>Delete</button>
        </div>
      )
    }
  ], []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn primary" onClick={() => setShowCreate(true)}>Create Bucket/Container</button>
      </div>

      <DataTable
        variant="transparent"
        columns={columns}
        rows={buckets}
        emptyMessage="No buckets found."
      />

      <Modal
        title="Create Bucket/Container"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        footer={(
          <>
            <button className="btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn primary" onClick={createBucket}>Create</button>
          </>
        )}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 4 }}>Name</div>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., app-uploads" />
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 4 }}>Provider</div>
            <select className="select" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              <option value="aws">AWS (S3)</option>
              <option value="azure">Azure (Blob)</option>
            </select>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 4 }}>Region</div>
            <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g., us-east-1 / eastus" />
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!form.public} onChange={(e) => setForm({ ...form, public: e.target.checked })} />
            <span className="text-sm">Public</span>
          </label>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            TODO: Validate naming and region availability via backend.
          </div>
        </div>
      </Modal>
    </>
  );
}
