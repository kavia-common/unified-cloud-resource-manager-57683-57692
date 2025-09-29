import React, { useMemo, useState } from "react";
import { DataTable } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

/**
 * PUBLIC_INTERFACE
 */
export default function DatabasesPanel() {
  /**
   * Database operations: Pause/Resume, Create/Delete snapshots, Scale up/down, View endpoints.
   */
  const toast = useToast();
  const [dbs, setDbs] = useState([
    { id: "rds-orders", name: "orders-db", engine: "postgres", provider: "aws", type: "db.t3.medium", region: "us-west-2", status: "available", endpoint: "orders-db.xxx.usw2.rds.amazonaws.com:5432" },
    { id: "azsql-app", name: "app-db", engine: "mssql", provider: "azure", type: "GP_S_Gen5_2", region: "eastus", status: "paused", endpoint: "app-db.database.windows.net:1433" },
  ]);
  const [selected, setSelected] = useState(null);
  const [showScale, setShowScale] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [showEndpoint, setShowEndpoint] = useState(false);

  function setStatus(id, status) { setDbs(prev => prev.map(d => (d.id === id ? { ...d, status } : d))); }

  // PUBLIC_INTERFACE
  function handleAction(id, action) {
    const db = dbs.find(d => d.id === id);
    switch (action) {
      case "pause":
        setStatus(id, "paused");
        toast.info(`Paused ${db?.name}`);
        // TODO: Backend call to pause DB
        break;
      case "resume":
        setStatus(id, "available");
        toast.success(`Resumed ${db?.name}`);
        // TODO: Backend call to resume DB
        break;
      case "snapshot":
        toast.success(`Snapshot created for ${db?.name}`);
        // TODO: Backend call to create snapshot
        break;
      case "delete-snapshot":
        toast.info(`Deleted latest snapshot for ${db?.name}`);
        // TODO: Backend call to delete snapshot
        break;
      case "scale":
        setSelected(db);
        setNewSize(db?.type || "");
        setShowScale(true);
        break;
      case "endpoint":
        setSelected(db);
        setShowEndpoint(true);
        break;
      default:
        break;
    }
  }

  function commitScale() {
    if (!selected || !newSize) return;
    setDbs(prev => prev.map(d => (d.id === selected.id ? { ...d, type: newSize } : d)));
    setShowScale(false);
    toast.success(`Scaled ${selected.name} to ${newSize}`);
    // TODO: Backend integration
  }

  const columns = useMemo(() => [
    { key: "name", label: "Name" },
    { key: "engine", label: "Engine" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "type", label: "Tier/Size" },
    { key: "region", label: "Region" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn ghost" onClick={() => handleAction(r.id, "pause")} disabled={r.status === "paused"}>Pause</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "resume")} disabled={r.status !== "paused"}>Resume</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "snapshot")}>Snapshot</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "delete-snapshot")}>Delete Snapshot</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "scale")}>Scale</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "endpoint")}>Endpoint</button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <DataTable
        variant="transparent"
        columns={columns}
        rows={dbs}
        emptyMessage="No databases found."
      />

      <Modal
        title={selected ? `Scale: ${selected.name}` : "Scale Database"}
        open={showScale}
        onClose={() => setShowScale(false)}
        footer={(
          <>
            <button className="btn ghost" onClick={() => setShowScale(false)}>Cancel</button>
            <button className="btn primary" onClick={commitScale}>Apply</button>
          </>
        )}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div className="text-xs" style={{ color: "var(--muted)" }}>New tier/size</div>
          <input className="input" placeholder="e.g., db.m5.large / GP_S_Gen5_4" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
          <div className="text-xs" style={{ color: "var(--muted)" }}>TODO: Load allowed sizes per engine/provider.</div>
        </div>
      </Modal>

      <Modal
        title={selected ? `Endpoint: ${selected.name}` : "Endpoint"}
        open={showEndpoint}
        onClose={() => setShowEndpoint(false)}
      >
        {selected && (
          <div style={{ display: "grid", gap: 10 }}>
            <Row k="Endpoint" v={selected.endpoint} />
            <Row k="Engine" v={selected.engine} />
            <Row k="Provider" v={selected.provider.toUpperCase()} />
            <Row k="Region" v={selected.region} />
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Use SSL and secure credentials. TODO: Fetch temporary creds/rotation via backend.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
      <div style={{ color: "var(--muted)", fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 600 }}>{v}</div>
    </div>
  );
}
