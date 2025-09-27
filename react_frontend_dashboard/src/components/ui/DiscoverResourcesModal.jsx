import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function DiscoverResourcesModal({ open, onClose, onComplete }) {
  /**
   * Enhanced Discover Modal:
   * - Auto-runs a mock cross-cloud scan on open.
   * - Displays minimalist, Pure White themed list of discovered resources.
   * - Uses in-memory mock data now; ready to switch to API later.
   *
   * Props:
   * - open: boolean to control visibility
   * - onClose: function to close the modal
   * - onComplete: optional callback({ summary, resources }) when discovery completes
   */
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [resources, setResources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const progressTimer = useRef(null);

  const providers = useMemo(() => ([
    { id: "aws", label: "AWS" },
    { id: "azure", label: "Azure" },
  ]), []);

  useEffect(() => {
    if (open) {
      // Reset state and auto-trigger scan on open
      setResources([]);
      setSummary(null);
      setError(null);
      setLog(["Initializing discovery…"]);
      setProgress(0);
      setIsScanning(true);

      // Run mock scan
      startMockScan();
    } else {
      // Cleanup when closing
      clearInterval(progressTimer.current);
      setIsScanning(false);
      setProgress(0);
      setLog([]);
      setResources([]);
      setSummary(null);
      setError(null);
    }

    return () => clearInterval(progressTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function startMockScan() {
    // Smooth progress animation
    setProgress(5);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 96) return p;
        return p + Math.max(1, Math.round((100 - p) / 18));
      });
    }, 320);

    // Simulate staged log updates
    setTimeout(() => setLog((l) => [...l, "Scanning AWS (2 accounts) and Azure (1 subscription)…"]), 300);
    setTimeout(() => setLog((l) => [...l, "Enumerating regions: us-east-1, us-west-2, eastus, westeurope…"]), 900);
    setTimeout(() => setLog((l) => [...l, "Collecting compute, storage, database, and networking resources…"]), 1400);

    // After delay, populate mock results
    setTimeout(() => {
      const mock = buildMockResources();
      const mockSummary = summarize(mock);
      setResources(mock);
      setSummary(mockSummary);
      setLog((l) => [...l, "Discovery complete."]);
      setProgress(100);
      clearInterval(progressTimer.current);
      setIsScanning(false);
      onComplete?.({ summary: mockSummary, resources: mock });
    }, 2000);
  }

  function summarize(list) {
    const s = { compute: 0, storage: 0, databases: 0, networking: 0 };
    for (const r of list) {
      const t = String(r.type || "").toLowerCase();
      if (["ec2", "vm", "aks-nodepool", "asg"].some((k) => t.includes(k) || t === "compute")) s.compute++;
      else if (["s3", "blob", "disk", "storage"].some((k) => t.includes(k) || t === "storage")) s.storage++;
      else if (["rds", "dynamodb", "cosmos", "postgres", "mysql", "sql"].some((k) => t.includes(k) || t === "database" || t === "databases")) s.databases++;
      else if (["vpc", "subnet", "nsg", "vnet", "lb", "gateway"].some((k) => t.includes(k) || t === "network" || t === "networking")) s.networking++;
    }
    return s;
  }

  function buildMockResources() {
    // In-memory mock results; ready for replacement with API call results.
    return [
      // AWS - Account A
      { accountName: "Prod Account A", provider: "AWS", region: "us-east-1", type: "EC2", name: "i-0a1b2c3d4e5", id: "i-0a1b2c3d4e5" },
      { accountName: "Prod Account A", provider: "AWS", region: "us-east-1", type: "RDS", name: "rds-prod-01", id: "arn:aws:rds:us-east-1:123:db:rds-prod-01" },
      { accountName: "Prod Account A", provider: "AWS", region: "us-west-2", type: "S3", name: "assets-prod-bucket", id: "assets-prod-bucket" },
      { accountName: "Prod Account A", provider: "AWS", region: "us-west-2", type: "VPC", name: "vpc-0cafe", id: "vpc-0cafe" },
      // AWS - Account B
      { accountName: "Dev Account B", provider: "AWS", region: "us-east-1", type: "EC2", name: "i-0f1e2d3c4b5", id: "i-0f1e2d3c4b5" },
      { accountName: "Dev Account B", provider: "AWS", region: "us-west-2", type: "DynamoDB", name: "orders-dev", id: "arn:aws:dynamodb:us-west-2:456:table/orders-dev" },
      // Azure - Subscription X
      { accountName: "Azure Sub X", provider: "Azure", region: "eastus", type: "VM", name: "vm-prod-01", id: "/subs/aaa/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm-prod-01" },
      { accountName: "Azure Sub X", provider: "Azure", region: "eastus", type: "Blob Storage", name: "storaccount01", id: "/subs/aaa/resourceGroups/rg1/providers/Microsoft.Storage/storageAccounts/storaccount01" },
      { accountName: "Azure Sub X", provider: "Azure", region: "westeurope", type: "Postgres", name: "pg-prod-eu", id: "/subs/aaa/resourceGroups/rg2/providers/Microsoft.DBforPostgreSQL/servers/pg-prod-eu" },
      { accountName: "Azure Sub X", provider: "Azure", region: "westeurope", type: "VNet", name: "vnet-core", id: "/subs/aaa/resourceGroups/rg2/providers/Microsoft.Network/virtualNetworks/vnet-core" },
    ];
  }

  function ProviderBadge({ provider }) {
    const label = String(provider || "").toUpperCase();
    const bg = "#111827"; // black-ish for minimalist accent
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        background: "#F9FAFB",
        border: "1px solid var(--border)",
        color: "#111827",
        fontSize: 12,
        fontWeight: 600,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: bg
        }} />
        {label}
      </span>
    );
  }

  const footer = (
    <>
      <button className="btn" onClick={onClose} disabled={isScanning}>Close</button>
      {!isScanning && (
        <a className="btn primary" href="/inventory">Open Inventory</a>
      )}
    </>
  );

  return (
    <Modal
      title="Discover Resources"
      open={open}
      onClose={onClose}
      footer={footer}
      disableBackdropClose={isScanning}
    >
      {/* Scan progress and logs */}
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>Progress</div>
          <div style={{
            height: 8,
            background: "#F3F4F6",
            border: "1px solid var(--border)",
            borderRadius: 999,
            overflow: "hidden"
          }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#111827",
                transition: "width .25s ease"
              }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              role="progressbar"
            />
          </div>
        </div>

        <div className="panel" style={{ padding: 10 }}>
          <div className="text-xs" style={{ color: "var(--muted)", marginBottom: 6 }}>Activity</div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 12 }}>
            {log.length === 0 ? <div>Idle.</div> : log.map((line, idx) => <div key={idx}>{line}</div>)}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="panel" style={{ padding: 12, borderColor: "#EF4444", color: "#991B1B", background: "#FEF2F2" }}>
            {error}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="panel" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Compute: {summary.compute}</li>
              <li>Storage: {summary.storage}</li>
              <li>Databases: {summary.databases}</li>
              <li>Networking: {summary.networking}</li>
            </ul>
          </div>
        )}

        {/* Resource list/table */}
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>Resources Found</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{resources.length} items</div>
          </div>

          {/* Empty state */}
          {resources.length === 0 && !isScanning && !error && (
            <div style={{ padding: 14, color: "var(--muted)", textAlign: "center" }}>
              No resources discovered yet.
            </div>
          )}

          {/* List rows */}
          {resources.length > 0 && (
            <div style={{ display: "grid" }}>
              {/* Header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.8fr 1.6fr",
                gap: 0,
                padding: "10px 12px",
                background: "#FFFFFF",
                color: "#6B7280",
                borderBottom: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 600
              }}>
                <div>Account</div>
                <div>Provider</div>
                <div>Region</div>
                <div>Type</div>
                <div>Name / ID</div>
              </div>

              {/* Data rows */}
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                {resources.map((r, idx) => (
                  <div
                    key={`${r.id}-${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.8fr 1.6fr",
                      gap: 0,
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                    }}
                  >
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.accountName}</div>
                    <div><ProviderBadge provider={r.provider} /></div>
                    <div>{r.region}</div>
                    <div>{r.type}</div>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name || r.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scanning overlay */}
          {isScanning && (
            <div style={{ padding: 14, color: "var(--muted)" }}>
              Scanning across linked AWS and Azure accounts…
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
