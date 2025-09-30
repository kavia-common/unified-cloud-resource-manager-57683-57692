import React, { useState, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import Tabs from "../../components/ui/Tabs";

/**
 * PUBLIC_INTERFACE
 * ResourceOps
 * Provides resource lifecycle management controls, scaling options, and bulk actions for cloud resources.
 * Features: Start/Stop/Restart/Terminate controls, resize/scale capabilities, and bulk operations.
 */
export default function ResourceOps() {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedResources, setSelectedResources] = useState([]);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [selectedResourceForScale, setSelectedResourceForScale] = useState(null);

  // Mock function for resource operations
  const handleResourceOperation = (operation, resourceIds) => {
    console.log(`Performing ${operation} on resources:`, resourceIds);
    // Show success message
    alert(`${operation} operation initiated for selected resources`);
  };

  // Mock function for scaling
  const handleScaleResource = (resource, newSize) => {
    console.log(`Scaling resource ${resource.id} to ${newSize}`);
    setScaleModalOpen(false);
    alert(`Scaling operation initiated for ${resource.name}`);
  };

  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-header" style={{ alignItems: "start", flexWrap: "wrap", gap: 10 }}>
        <div className="panel-title">Resource Operations</div>
      </div>

      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        <Tabs
          tabs={["All", "Compute", "Storage", "Databases", "Networking"]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {selectedResources.length > 0 && (
          <div className="bulk-actions" style={{ 
            padding: "8px 12px",
            background: "#F9FAFB",
            borderRadius: "8px",
            display: "flex",
            gap: "8px",
            alignItems: "center"
          }}>
            <span>{selectedResources.length} resources selected</span>
            <button 
              className="btn"
              onClick={() => handleResourceOperation("Start", selectedResources)}
            >
              Start All
            </button>
            <button 
              className="btn"
              onClick={() => handleResourceOperation("Stop", selectedResources)}
            >
              Stop All
            </button>
            <button 
              className="btn"
              onClick={() => handleResourceOperation("Terminate", selectedResources)}
              style={{ color: "#EF4444" }}
            >
              Terminate All
            </button>
          </div>
        )}

        <section aria-live="polite">
          <ResourceTable
            activeTab={activeTab}
            selectedResources={selectedResources}
            onSelectionChange={setSelectedResources}
            onScaleResource={(resource) => {
              setSelectedResourceForScale(resource);
              setScaleModalOpen(true);
            }}
            onResourceOperation={handleResourceOperation}
          />
        </section>
      </div>

      {/* Scale Modal */}
      {selectedResourceForScale && (
        <ScaleResourceModal
          resource={selectedResourceForScale}
          open={scaleModalOpen}
          onClose={() => {
            setScaleModalOpen(false);
            setSelectedResourceForScale(null);
          }}
          onScale={handleScaleResource}
        />
      )}
    </div>
  );
}

function ResourceTable({ 
  activeTab, 
  selectedResources, 
  onSelectionChange,
  onScaleResource,
  onResourceOperation 
}) {
  // Mock data - in real app this would come from an API
  const allResources = useMemo(
    () => [
      { id: "i-0a1b2c3", name: "web-01", type: "VM", provider: "AWS", region: "us-east-1", status: "running", size: "t2.micro" },
      { id: "vm-az-001", name: "az-web-01", type: "VM", provider: "Azure", region: "eastus", status: "running", size: "Standard_B1s" },
      { id: "s3-prod-logs", name: "prod-logs", type: "Storage", provider: "AWS", region: "us-east-1", status: "active", size: "500GB" },
      { id: "rds-001", name: "orders-db", type: "Database", provider: "AWS", region: "us-east-1", status: "available", size: "db.t3.medium" },
      { id: "azsql-002", name: "bi-warehouse", type: "Database", provider: "Azure", region: "eastus", status: "stopped", size: "GP_Gen5_2" },
      { id: "alb-123", name: "public-alb", type: "Networking", provider: "AWS", region: "us-west-2", status: "active", size: "n/a" },
    ],
    []
  );

  // Filter resources based on active tab
  const resources = useMemo(() => {
    if (activeTab === "All") return allResources;
    return allResources.filter(r => r.type.toLowerCase() === activeTab.toLowerCase());
  }, [activeTab, allResources]);

  return (
    <div className="table-wrapper">
      <table role="table" aria-label="Resource operations table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedResources.length === resources.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange(resources.map(r => r.id));
                  } else {
                    onSelectionChange([]);
                  }
                }}
              />
            </th>
            <th>Resource Name</th>
            <th>Type</th>
            <th>Provider</th>
            <th>Region</th>
            <th>Status</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.length === 0 && (
            <tr>
              <td className="table__cell--empty" colSpan={8}>No resources found</td>
            </tr>
          )}
          {resources.map((r) => (
            <tr key={r.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedResources.includes(r.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectionChange([...selectedResources, r.id]);
                    } else {
                      onSelectionChange(selectedResources.filter(id => id !== r.id));
                    }
                  }}
                />
              </td>
              <td>
                <div style={{ display: "grid", gap: 2 }}>
                  <strong>{r.name}</strong>
                  <span className="text-subtle" style={{ fontSize: 12 }}>{r.id}</span>
                </div>
              </td>
              <td>{r.type}</td>
              <td>{r.provider}</td>
              <td>{r.region}</td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.size}</td>
              <td>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.status !== "running" && (
                    <button
                      className="btn"
                      onClick={() => onResourceOperation("Start", [r.id])}
                      aria-label={`Start ${r.name}`}
                    >
                      Start
                    </button>
                  )}
                  {r.status === "running" && (
                    <>
                      <button
                        className="btn"
                        onClick={() => onResourceOperation("Stop", [r.id])}
                        aria-label={`Stop ${r.name}`}
                      >
                        Stop
                      </button>
                      <button
                        className="btn"
                        onClick={() => onResourceOperation("Restart", [r.id])}
                        aria-label={`Restart ${r.name}`}
                      >
                        Restart
                      </button>
                    </>
                  )}
                  {r.type !== "Networking" && (
                    <button
                      className="btn"
                      onClick={() => onScaleResource(r)}
                      aria-label={`Scale ${r.name}`}
                    >
                      Scale
                    </button>
                  )}
                  <button
                    className="btn"
                    onClick={() => onResourceOperation("Terminate", [r.id])}
                    aria-label={`Terminate ${r.name}`}
                    style={{ color: "#EF4444" }}
                  >
                    Terminate
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    running: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0", label: "Running" },
    stopped: { bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA", label: "Stopped" },
    available: { bg: "#ECFDF5", fg: "#047857", bd: "#A7F3D0", label: "Available" },
    active: { bg: "#DBEAFE", fg: "#1E3A8A", bd: "#BFDBFE", label: "Active" },
    unknown: { bg: "#F3F4F6", fg: "#374151", bd: "#E5E7EB", label: "Unknown" },
  };
  const c = map[status] || map.unknown;
  return (
    <span
      className="badge"
      style={{
        background: c.bg,
        color: c.fg,
        borderColor: c.bd,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {c.label}
    </span>
  );
}

function ScaleResourceModal({ resource, open, onClose, onScale }) {
  const [newSize, setNewSize] = useState("");

  const sizeOptions = useMemo(() => {
    switch (resource?.type) {
      case "VM":
        return resource.provider === "AWS" 
          ? ["t2.micro", "t2.small", "t2.medium", "t2.large"]
          : ["Standard_B1s", "Standard_B2s", "Standard_B4ms", "Standard_B8ms"];
      case "Database":
        return resource.provider === "AWS"
          ? ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large"]
          : ["GP_Gen5_2", "GP_Gen5_4", "GP_Gen5_8", "GP_Gen5_16"];
      case "Storage":
        return ["100GB", "500GB", "1TB", "2TB"];
      default:
        return [];
    }
  }, [resource]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Scale Resource: ${resource?.name}`}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            onClick={() => onScale(resource, newSize)}
            disabled={!newSize}
          >
            Apply
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <div style={{ marginBottom: 8 }}>Current Size: {resource?.size}</div>
          <label style={{ display: "grid", gap: 4 }}>
            <span>New Size:</span>
            <select
              className="input"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
            >
              <option value="">Select size...</option>
              {sizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </Modal>
  );
}
