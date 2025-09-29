import React, { useMemo, useState } from "react";
import Tabs from "../../components/ui/Tabs";
import Modal from "../../components/ui/Modal";

/**
 * PUBLIC_INTERFACE
 * Inventory
 * Tabbed inventory with operational controls per resource type: Compute, Storage, Databases, Networking.
 * Each tab shows minimalist lists and action buttons with mock handlers (console/alert), no backend calls yet.
 */
export default function Inventory() {
  const [activeTab, setActiveTab] = useState("Compute");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel-header" style={{ alignItems: "start", flexWrap: "wrap", gap: 10 }}>
        <div className="panel-title">Inventory</div>
      </div>

      <Tabs tabs={["Compute", "Storage", "Databases", "Networking"]} active={activeTab} onChange={setActiveTab} />

      <section aria-live="polite">
        {activeTab === "Compute" && <ComputeResources />}
        {activeTab === "Storage" && <StorageResources />}
        {activeTab === "Databases" && <DatabaseResources />}
        {activeTab === "Networking" && <NetworkingResources />}
      </section>
    </div>
  );
}

/** Compute tab: Start/Stop/Restart/Resize/Terminate/View Details/Stats */
function ComputeResources() {
  const instances = useMemo(
    () => [
      { id: "i-0a1b2c3d4e5f", name: "web-01", size: "t3.medium", state: "stopped", provider: "AWS", region: "us-east-1" },
      { id: "i-1234567890ab", name: "api-01", size: "m5.large", state: "running", provider: "AWS", region: "us-east-2" },
      { id: "vm-az-001", name: "az-web-01", size: "Standard_D2s_v5", state: "running", provider: "Azure", region: "eastus" },
    ],
    []
  );

  const [resizeTarget, setResizeTarget] = useState(null);

  const onAction = (action, row) => {
    if (action === "Resize") {
      setResizeTarget(row);
      return;
    }
    if (action === "View Details" || action === "View Stats") {
      console.log(`${action} ->`, row);
      window.alert(`${action} (mock)\n${row.name} (${row.id})`);
      return;
    }
    console.log(`${action} requested for`, row.id);
    window.alert(`${action} requested (mock) for ${row.name}`);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {instances.map((r) => (
        <div key={r.id} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: "#111827" }}>{r.name}</strong>
              <span style={muted}>ID: {r.id} · {r.provider} · {r.region} · {r.size}</span>
            </div>
            <span style={badge(r.state)}>{r.state}</span>
          </div>
          <div style={actionRow}>
            {["Start", "Stop", "Restart", "Resize", "Terminate", "View Details", "View Stats"].map((a) => (
              <button
                key={a}
                style={a === "Terminate" ? actionBtnDanger : actionBtn}
                disabled={(a === "Start" && r.state === "running") || (a === "Stop" && r.state !== "running")}
                onClick={() => onAction(a, r)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Modal open={!!resizeTarget} onClose={() => setResizeTarget(null)} title={`Resize - ${resizeTarget?.name}`}>
        <ResizeForm
          current={resizeTarget?.size}
          onSubmit={(sz) => {
            setResizeTarget(null);
            console.log("Resize to", sz, "for", resizeTarget?.id);
            window.alert(`Resize to ${sz} requested (mock)`);
          }}
        />
      </Modal>
    </div>
  );
}

function ResizeForm({ current = "t3.medium", onSubmit }) {
  const [size, setSize] = useState(current);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(size);
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <label style={smallLabel}>New size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle}>
          <option>t3.small</option>
          <option>t3.medium</option>
          <option>m5.large</option>
          <option>m5.xlarge</option>
          <option>Standard_D2s_v5</option>
          <option>Standard_F4s_v2</option>
        </select>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={primaryBtn}>Request Resize</button>
      </div>
    </form>
  );
}

/** Storage tab: Create/Delete bucket, Adjust access (public/private), View usage/cost, Empty bucket */
function StorageResources() {
  const [buckets, setBuckets] = useState([
    { name: "prod-logs", provider: "AWS S3", region: "us-east-1", public: false, objects: 125430 },
    { name: "media-assets", provider: "AWS S3", region: "us-west-2", public: true, objects: 20485 },
    { name: "az-prod-data", provider: "Azure Blob", region: "eastus", public: false, objects: 55340 },
  ]);
  const [creating, setCreating] = useState(false);

  const createBucket = (b) => {
    setBuckets((prev) => [...prev, b]);
    window.alert(`Bucket ${b.name} created (mock)`);
  };

  const toggleAccess = (name) => {
    setBuckets((prev) =>
      prev.map((b) => (b.name === name ? { ...b, public: !b.public } : b))
    );
    window.alert(`Access updated (mock) for ${name}`);
  };

  const emptyBucket = (name) => window.alert(`Empty bucket requested (mock) for ${name}`);
  const deleteBucket = (name) => {
    setBuckets((prev) => prev.filter((b) => b.name !== name));
    window.alert(`Delete bucket requested (mock) for ${name}`);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={primaryBtn} onClick={() => setCreating(true)}>Create Bucket</button>
      </div>
      {buckets.map((b) => (
        <div key={b.name} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: "#111827" }}>{b.name}</strong>
              <span style={muted}>{b.provider} · {b.region} · Objects: {b.objects}</span>
            </div>
            <span style={badge(b.public ? "public" : "private")}>{b.public ? "public" : "private"}</span>
          </div>
          <div style={actionRow}>
            <button style={actionBtn} onClick={() => toggleAccess(b.name)}>
              {b.public ? "Make Private" : "Make Public"}
            </button>
            <button style={actionBtn} onClick={() => window.alert(`Usage/Cost (mock) for ${b.name}`)}>View Usage/Cost</button>
            <button style={actionBtn} onClick={() => emptyBucket(b.name)}>Empty</button>
            <button style={actionBtnDanger} onClick={() => deleteBucket(b.name)}>Delete</button>
          </div>
        </div>
      ))}

      <Modal open={creating} onClose={() => setCreating(false)} title="Create Bucket/Container">
        <CreateBucketForm
          onSubmit={(payload) => {
            setCreating(false);
            createBucket(payload);
          }}
        />
      </Modal>
    </div>
  );
}

function CreateBucketForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("AWS S3");
  const [region, setRegion] = useState("us-east-1");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          window.alert("Please provide a name");
          return;
        }
        onSubmit?.({ name: name.trim(), provider, region, public: false, objects: 0 });
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <label style={smallLabel}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={smallLabel}>Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={selectStyle}>
            <option>AWS S3</option>
            <option>Azure Blob</option>
          </select>
        </div>
        <div>
          <label style={smallLabel}>Region</label>
          <input value={region} onChange={(e) => setRegion(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" style={primaryBtn}>Create</button>
        </div>
      </div>
    </form>
  );
}

/** Databases tab: Pause/Resume, Create/Delete Snapshot, Scale, View connection info */
function DatabaseResources() {
  const dbs = useMemo(
    () => [
      { id: "rds-001", name: "orders-db", engine: "postgres", size: "db.m5.large", status: "available", endpoint: "orders.example:5432" },
      { id: "azsql-002", name: "bi-warehouse", engine: "mssql", size: "BC_Gen5_4", status: "paused", endpoint: "bi.example:1433" },
    ],
    []
  );
  const [scaleTarget, setScaleTarget] = useState(null);

  const notify = (m) => {
    console.log(m);
    window.alert(m);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {dbs.map((d) => (
        <div key={d.id} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: "#111827" }}>{d.name}</strong>
              <span style={muted}>ID: {d.id} · {d.engine} · {d.size}</span>
            </div>
            <span style={badge(d.status)}>{d.status}</span>
          </div>
          <div style={actionRow}>
            {d.status === "paused" ? (
              <button style={actionBtn} onClick={() => notify("Resume requested (mock)")}>Resume</button>
            ) : (
              <button style={actionBtn} onClick={() => notify("Pause requested (mock)")}>Pause</button>
            )}
            <button style={actionBtn} onClick={() => notify("Create snapshot requested (mock)")}>Create Snapshot</button>
            <button style={actionBtn} onClick={() => notify("Delete snapshot requested (mock)")}>Delete Snapshot</button>
            <button style={actionBtn} onClick={() => setScaleTarget(d)}>Scale</button>
            <button style={actionBtn} onClick={() => window.alert(`Connection: ${d.endpoint}`)}>View Connection</button>
            <button style={actionBtnDanger} onClick={() => notify("Delete DB requested (mock)")}>Delete</button>
          </div>
        </div>
      ))}

      <Modal open={!!scaleTarget} onClose={() => setScaleTarget(null)} title={`Scale - ${scaleTarget?.name}`}>
        <ScaleForm
          current={scaleTarget?.size}
          onSubmit={(sz) => {
            setScaleTarget(null);
            notify(`Scale to ${sz} requested (mock)`);
          }}
        />
      </Modal>
    </div>
  );
}

function ScaleForm({ current = "db.m5.large", onSubmit }) {
  const [size, setSize] = useState(current);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(size);
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <label style={smallLabel}>Instance size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)} style={selectStyle}>
          <option>db.t3.medium</option>
          <option>db.m5.large</option>
          <option>db.r6g.large</option>
          <option>GP_S_Gen5_2</option>
          <option>BC_Gen5_4</option>
        </select>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={primaryBtn}>Request Scale</button>
      </div>
    </form>
  );
}

/** Networking tab: Manage security groups/firewalls, Attach/detach IP, Create/Delete load balancers, List VPCs/subnets */
function NetworkingResources() {
  const sgs = useMemo(
    () => [
      { id: "sg-0a1b2c", name: "web-sg", rules: 5, attached: 3, provider: "AWS" },
      { id: "az-nsg-01", name: "az-web-nsg", rules: 7, attached: 2, provider: "Azure" },
    ],
    []
  );
  const lbs = useMemo(
    () => [
      { id: "alb-123", name: "public-alb", type: "application", listeners: 2, targets: 4, provider: "AWS" },
      { id: "az-lb-1", name: "front-door", type: "layer4", listeners: 3, targets: 6, provider: "Azure" },
    ],
    []
  );

  const notify = (m) => {
    console.log(m);
    window.alert(m);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Security Groups / Firewalls</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={actionBtn} onClick={() => notify("List VPCs (mock)")}>List VPCs</button>
          <button style={actionBtn} onClick={() => notify("List Subnets (mock)")}>List Subnets</button>
        </div>
      </div>
      {sgs.map((g) => (
        <div key={g.id} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: "#111827" }}>{g.name}</strong>
              <span style={muted}>ID: {g.id} · Rules: {g.rules} · Attached: {g.attached} · {g.provider}</span>
            </div>
          </div>
          <div style={actionRow}>
            <button style={actionBtn} onClick={() => notify("Manage rules (mock)")}>Manage Rules</button>
            <button style={actionBtn} onClick={() => notify("Attach IP requested (mock)")}>Attach IP</button>
            <button style={actionBtn} onClick={() => notify("Detach IP requested (mock)")}>Detach IP</button>
            <button style={actionBtnDanger} onClick={() => notify("Delete SG requested (mock)")}>Delete</button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <strong>Load Balancers</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={primaryBtn} onClick={() => notify("Create Load Balancer (mock)")}>Create LB</button>
          <button style={actionBtnDanger} onClick={() => notify("Delete Load Balancer (mock)")}>Delete LB</button>
        </div>
      </div>
      {lbs.map((lb) => (
        <div key={lb.id} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: "#111827" }}>{lb.name}</strong>
              <span style={muted}>ID: {lb.id} · {lb.type} · Listeners: {lb.listeners} · Targets: {lb.targets} · {lb.provider}</span>
            </div>
          </div>
          <div style={actionRow}>
            <button style={actionBtn} onClick={() => notify("Manage targets (mock)")}>Manage Targets</button>
            <button style={actionBtn} onClick={() => notify("Add listener (mock)")}>Add Listener</button>
            <button style={actionBtnDanger} onClick={() => notify("Delete LB requested (mock)")}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Minimalist shared styles */
const muted = { color: "#6B7280", fontSize: 13 };
const cardStyle = { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 };
const cardHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 };
const actionRow = { display: "flex", gap: 6, flexWrap: "wrap" };
const actionBtn = { background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#374151", padding: "6px 10px", borderRadius: 8, fontSize: 12 };
const actionBtnDanger = { background: "#FFFFFF", border: "1px solid #EF4444", color: "#EF4444", padding: "6px 10px", borderRadius: 8, fontSize: 12 };
const primaryBtn = { background: "#111827", border: "1px solid #111827", color: "#FFFFFF", padding: "6px 12px", borderRadius: 8, fontSize: 12 };
const smallLabel = { display: "block", color: "#374151", fontSize: 13, marginBottom: 6 };
const selectStyle = { width: "100%", background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#111827", padding: "8px 10px", borderRadius: 8, fontSize: 13 };
const inputStyle = { width: "100%", background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#111827", padding: "8px 10px", borderRadius: 8, fontSize: 13 };

function badge(s) {
  const map = {
    running: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0" },
    stopped: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA" },
    available: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0" },
    paused: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA" },
    public: { bg: "#DBEAFE", fg: "#1E3A8A", bd: "#BFDBFE" },
    private: { bg: "#F3F4F6", fg: "#374151", bd: "#E5E7EB" },
  };
  const c = map[s] || { bg: "#F3F4F6", fg: "#374151", bd: "#E5E7EB" };
  return {
    background: c.bg,
    color: c.fg,
    border: `1px solid ${c.bd}`,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
}
