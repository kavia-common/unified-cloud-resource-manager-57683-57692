import React, { useMemo, useState } from "react";
import { DataTable } from "../../../components/ui/Table";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

/**
 * PUBLIC_INTERFACE
 */
export default function NetworkingPanel() {
  /**
   * Manage networking: security groups/firewalls, public IPs, load balancers, VPCs/subnets.
   */
  const toast = useToast();

  // Security groups / firewalls
  const [secGroups, setSecGroups] = useState([
    { id: "sg-web", name: "web-sg", provider: "aws", rules: 5 },
    { id: "nsg-app", name: "app-nsg", provider: "azure", rules: 8 },
  ]);

  // Public IP attachments
  const [publicIps, setPublicIps] = useState([
    { id: "eip-1", ip: "54.12.45.67", attached_to: "i-001", provider: "aws" },
    { id: "pip-1", ip: "20.50.10.22", attached_to: null, provider: "azure" },
  ]);

  // Load balancers
  const [lbs, setLbs] = useState([
    { id: "alb-1", name: "public-alb", provider: "aws", type: "ALB", dns: "alb-1.elb.amazonaws.com" },
    { id: "lb-az-1", name: "app-lb", provider: "azure", type: "Public", dns: "app-lb.eastus.cloudapp.azure.com" },
  ]);

  // VPCs/Subnets
  const [networks] = useState([
    { id: "vpc-1", provider: "aws", name: "prod-vpc", cidr: "10.0.0.0/16", subnets: 6 },
    { id: "vnet-1", provider: "azure", name: "prod-vnet", cidr: "10.20.0.0/16", subnets: 4 },
  ]);

  const [showSgModal, setShowSgModal] = useState(false);
  const [sgName, setSgName] = useState("");
  const [selectedIp, setSelectedIp] = useState(null);
  const [attachTarget, setAttachTarget] = useState("");

  // PUBLIC_INTERFACE
  function createSecGroup() {
    if (!sgName) return toast.info("Name is required");
    setSecGroups(prev => [{ id: `sg-${sgName}`, name: sgName, provider: "aws", rules: 0 }, ...prev]);
    setShowSgModal(false);
    toast.success("Security group created");
    // TODO: Backend create SG/NSG
  }

  // PUBLIC_INTERFACE
  function deleteSecGroup(id) {
    setSecGroups(prev => prev.filter(s => s.id !== id));
    toast.error("Security group deleted");
    // TODO: Backend delete SG/NSG
  }

  // PUBLIC_INTERFACE
  function attachIp(id, targetId) {
    setPublicIps(prev => prev.map(p => (p.id === id ? { ...p, attached_to: targetId || null } : p)));
    toast.success("Public IP attached");
    // TODO: Backend associate EIP/Public IP
  }

  // PUBLIC_INTERFACE
  function detachIp(id) {
    setPublicIps(prev => prev.map(p => (p.id === id ? { ...p, attached_to: null } : p)));
    toast.info("Public IP detached");
    // TODO: Backend disassociate IP
  }

  // PUBLIC_INTERFACE
  function createLoadBalancer() {
    const id = `lb-${Math.random().toString(36).slice(2, 6)}`;
    setLbs(prev => [{ id, name: `lb-${prev.length + 1}`, provider: "aws", type: "ALB", dns: `${id}.elb.amazonaws.com` }, ...prev]);
    toast.success("Load balancer created");
    // TODO: Backend create LB
  }

  // PUBLIC_INTERFACE
  function deleteLoadBalancer(id) {
    setLbs(prev => prev.filter(l => l.id !== id));
    toast.error("Load balancer deleted");
    // TODO: Backend delete LB
  }

  const sgCols = useMemo(() => [
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "rules", label: "Rules" },
    {
      key: "actions", label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn" style={{ borderColor: "var(--border)", color: "#EF4444" }} onClick={() => deleteSecGroup(r.id)}>Delete</button>
        </div>
      )
    }
  ], []);

  const ipCols = useMemo(() => [
    { key: "ip", label: "Public IP" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "attached_to", label: "Attached To", render: v => v || "—" },
    {
      key: "actions", label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          {r.attached_to ? (
            <button className="btn ghost" onClick={() => detachIp(r.id)}>Detach</button>
          ) : (
            <>
              <button className="btn ghost" onClick={() => { setSelectedIp(r); }}>Attach</button>
            </>
          )}
        </div>
      )
    }
  ], []);

  const lbCols = useMemo(() => [
    { key: "name", label: "Name" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "type", label: "Type" },
    { key: "dns", label: "DNS Name" },
    {
      key: "actions", label: "Actions",
      render: (_v, r) => (
        <div className="table__actions">
          <button className="btn ghost" onClick={createLoadBalancer}>Create</button>
          <button className="btn" style={{ borderColor: "var(--border)", color: "#EF4444" }} onClick={() => deleteLoadBalancer(r.id)}>Delete</button>
        </div>
      )
    }
  ], []);

  const netCols = useMemo(() => [
    { key: "name", label: "VPC/VNet" },
    { key: "provider", label: "Provider", render: v => String(v || "").toUpperCase() },
    { key: "cidr", label: "CIDR" },
    { key: "subnets", label: "Subnets" },
  ], []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">Security Groups / Firewalls</div>
          <div>
            <button className="btn primary" onClick={() => setShowSgModal(true)}>Create</button>
          </div>
        </div>
        <div className="panel-body">
          <DataTable variant="transparent" columns={sgCols} rows={secGroups} emptyMessage="No security groups." />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">Public IPs</div>
        </div>
        <div className="panel-body">
          <DataTable variant="transparent" columns={ipCols} rows={publicIps} emptyMessage="No public IPs." />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">Load Balancers</div>
        </div>
        <div className="panel-body">
          <DataTable variant="transparent" columns={lbCols} rows={lbs} emptyMessage="No load balancers." />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">VPCs / VNets</div>
        </div>
        <div className="panel-body">
          <DataTable variant="transparent" columns={netCols} rows={networks} emptyMessage="No networks discovered." />
        </div>
      </section>

      <Modal
        title={selectedIp ? `Attach IP ${selectedIp.ip}` : "Attach IP"}
        open={!!selectedIp}
        onClose={() => { setSelectedIp(null); setAttachTarget(""); }}
        footer={(
          <>
            <button className="btn ghost" onClick={() => { setSelectedIp(null); setAttachTarget(""); }}>Cancel</button>
            <button className="btn primary" onClick={() => { attachIp(selectedIp.id, attachTarget); setSelectedIp(null); setAttachTarget(""); }}>Attach</button>
          </>
        )}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Attach to instance ID</div>
          <input className="input" placeholder="e.g., i-0abcd1234 / vm-xyz" value={attachTarget} onChange={(e) => setAttachTarget(e.target.value)} />
          <div className="text-xs" style={{ color: "var(--muted)" }}>TODO: Search/validate target from inventory via backend.</div>
        </div>
      </Modal>

      <Modal
        title="Create Security Group"
        open={showSgModal}
        onClose={() => setShowSgModal(false)}
        footer={(
          <>
            <button className="btn ghost" onClick={() => setShowSgModal(false)}>Cancel</button>
            <button className="btn primary" onClick={createSecGroup}>Create</button>
          </>
        )}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 4 }}>Name</div>
            <input className="input" placeholder="e.g., web-sg" value={sgName} onChange={(e) => setSgName(e.target.value)} />
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>TODO: Choose provider/VPC and define initial rules.</div>
        </div>
      </Modal>
    </div>
  );
}
