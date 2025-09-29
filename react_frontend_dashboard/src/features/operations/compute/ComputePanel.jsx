import React, { useMemo, useState } from "react";
import { DataTable } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

/**
 * PUBLIC_INTERFACE
 */
export default function ComputePanel() {
  /**
   * Minimalist table of instances with action dropdown via inline buttons.
   * Supports Start/Stop/Restart/Resize/Terminate, and a Details modal.
   */
  const toast = useToast();
  const [instances, setInstances] = useState([
    { id: "i-001", name: "web-01", provider: "aws", type: "t3.medium", region: "us-east-1", status: "running", cpu: 22, mem: 58 },
    { id: "i-002", name: "web-02", provider: "aws", type: "t3.small", region: "us-east-1", status: "stopped", cpu: 0, mem: 0 },
    { id: "vm-az-01", name: "api-01", provider: "azure", type: "Standard_B2s", region: "eastus", status: "running", cpu: 18, mem: 44 },
  ]);
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResize, setShowResize] = useState(false);
  const [newSize, setNewSize] = useState("");

  function updateStatus(id, status) {
    setInstances(prev => prev.map(i => (i.id === id ? { ...i, status } : i)));
  }

  // PUBLIC_INTERFACE
  async function handleAction(id, action) {
    /**
     * Stubs for instance lifecycle management.
     * TODO: Integrate with Supabase Edge Functions for actual provider actions.
     */
    const inst = instances.find(i => i.id === id);
    try {
      switch (action) {
        case "start":
          updateStatus(id, "running");
          toast.success(`Started ${inst?.name}`);
          break;
        case "stop":
          updateStatus(id, "stopped");
          toast.success(`Stopped ${inst?.name}`);
          break;
        case "restart":
          updateStatus(id, "running");
          toast.info(`Restarted ${inst?.name}`);
          break;
        case "terminate":
          setInstances(prev => prev.filter(i => i.id !== id));
          toast.error(`Terminated ${inst?.name}`);
          break;
        case "resize":
          setSelected(inst);
          setNewSize(inst?.type || "");
          setShowResize(true);
          break;
        case "details":
          setSelected(inst);
          setShowDetails(true);
          break;
        default:
          break;
      }
      // Example backend stub:
      // await controlResource({ provider: inst.provider, resourceId: id, operation: action, params: {} });
    } catch (err) {
      toast.error(err?.message || "Operation failed");
    }
  }

  function commitResize() {
    if (!selected || !newSize) return;
    setInstances(prev => prev.map(i => (i.id === selected.id ? { ...i, type: newSize } : i)));
    setShowResize(false);
    toast.success(`Resized ${selected.name} to ${newSize}`);
    // TODO: Backend integration for resize action via Edge Function
  }

  const columns = useMemo(() => [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "type", label: "Instance Type" },
    { key: "region", label: "Region" },
    { key: "status", label: "Status", cellClassName: (v) => v === "running" ? "text-success" : "" },
    { key: "cpu", label: "CPU %" },
    { key: "mem", label: "Mem %" },
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn ghost" onClick={() => handleAction(r.id, "start")} disabled={r.status === "running"}>Start</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "stop")} disabled={r.status === "stopped"}>Stop</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "restart")} disabled={r.status !== "running"}>Restart</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "resize")}>Resize</button>
          <button className="btn" style={{ borderColor: "var(--border)", color: "#EF4444" }} onClick={() => handleAction(r.id, "terminate")}>Terminate</button>
          <button className="btn ghost" onClick={() => handleAction(r.id, "details")}>Details</button>
        </div>
      ),
    },
  ], [instances]);

  return (
    <>
      <DataTable
        variant="transparent"
        columns={columns}
        rows={instances}
        emptyMessage="No instances found."
      />

      <Modal
        title={selected ? `Instance: ${selected.name}` : "Instance Details"}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      >
        {selected && (
          <div style={{ display: "grid", gap: 8 }}>
            <Row k="ID" v={selected.id} />
            <Row k="Provider" v={selected.provider.toUpperCase()} />
            <Row k="Type" v={selected.type} />
            <Row k="Region" v={selected.region} />
            <Row k="Status" v={selected.status} />
            <Row k="CPU" v={`${selected.cpu}%`} />
            <Row k="Memory" v={`${selected.mem}%`} />
          </div>
        )}
      </Modal>

      <Modal
        title={selected ? `Resize: ${selected.name}` : "Resize Instance"}
        open={showResize}
        onClose={() => setShowResize(false)}
        footer={(
          <>
            <button className="btn ghost" onClick={() => setShowResize(false)}>Cancel</button>
            <button className="btn primary" onClick={commitResize}>Apply</button>
          </>
        )}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <label className="text-sm" style={{ color: "var(--muted)" }}>New instance type/size</label>
          <input className="input" placeholder="e.g., t3.large / Standard_D2s_v5" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            TODO: Validate allowed sizes per provider and region. This will be loaded from backend.
          </div>
        </div>
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
