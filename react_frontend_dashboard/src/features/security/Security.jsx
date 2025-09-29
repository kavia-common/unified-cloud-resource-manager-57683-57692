import React, { useMemo, useRef, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Popover } from "../../components/ui/Popover";
import { Tabs } from "../../components/ui/Tabs";

/**
 * PUBLIC_INTERFACE
 * Security & Compliance dashboard
 * - Public Exposure Warnings for buckets, VMs, DBs (mocked)
 * - Key Rotation / Expiration Reminders (mocked)
 * - IAM Policy Clarity: analyze access patterns and suggest least-privilege (mocked)
 *
 * Assumptions:
 * - No backend endpoints yet; using static/mock data. Replace mock loaders with Supabase Edge Functions when available.
 * - Env needed for future integration: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY (already part of container).
 */
export default function Security() {
  const [activeTab, setActiveTab] = useState("exposure");

  const tabs = [
    { id: "exposure", label: "Public Exposure" },
    { id: "keys", label: "Key Rotation" },
    { id: "iam", label: "IAM Clarity" },
  ];

  return (
    <div className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="panel-header">
        <div className="panel-title">Security & Compliance</div>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>
      <div className="panel-body">
        {activeTab === "exposure" && <PublicExposureWarnings />}
        {activeTab === "keys" && <KeyRotationReminders />}
        {activeTab === "iam" && <IamPolicyClarity />}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Public Exposure Warnings
 * Highlights publicly accessible resources with remediation guidance.
 */
function PublicExposureWarnings() {
  // Mocked exposure dataset
  const items = useMemo(
    () => [
      {
        id: "s3-logs",
        type: "S3 Bucket",
        provider: "AWS",
        name: "prod-logs",
        issue: "Public read ACL detected",
        risk: "High",
        details: "s3:GetObject allowed for AllUsers",
        recommendation:
          "Remove public-read ACL. Use bucket policy with explicit principals. Block Public Access.",
        evidence: "ACL grants: URI http://acs.amazonaws.com/groups/global/AllUsers",
      },
      {
        id: "vm-az",
        type: "VM",
        provider: "Azure",
        name: "dev-api-01",
        issue: "NSG rule allows 0.0.0.0/0 on SSH (22)",
        risk: "High",
        details: "Inbound rule: Any -> 22/TCP",
        recommendation:
          "Restrict to corporate IPs or Bastion. Consider Just-in-Time access.",
        evidence: "Rule: priority=100 allow ANY:22",
      },
      {
        id: "db-rds",
        type: "Database",
        provider: "AWS",
        name: "orders-db",
        issue: "Publicly accessible endpoint",
        risk: "Medium",
        details: "rds:PubliclyAccessible = true",
        recommendation:
          "Move to private subnet, use security groups/VPC peering, or a proxy.",
        evidence: "Endpoint reachable over internet",
      },
    ],
    []
  );

  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Note: using mock detections. Replace with provider scans or CSPM feed.
      </div>
      <div
        className="card-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(220px, 1fr))" }}
      >
        {items.map((it) => (
          <ExposureCard key={it.id} item={it} onInspect={() => setSelected(it)} />
        ))}
      </div>

      <Modal
        title={selected ? `Exposure Details — ${selected.name}` : "Exposure Details"}
        open={!!selected}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              className="btn primary"
              onClick={() => {
                // Stub: wire to remediation workflows later
                alert("TODO: Open remediation playbook / automation");
                setSelected(null);
              }}
            >
              Remediate
            </button>
          </>
        }
      >
        {selected && (
          <div style={{ display: "grid", gap: 10 }}>
            <Row label="Resource">
              {selected.provider} {selected.type} • {selected.name}
            </Row>
            <Row label="Issue">{selected.issue}</Row>
            <Row label="Risk">
              <RiskBadge level={selected.risk} />
            </Row>
            <Row label="Details">{selected.details}</Row>
            <Row label="Evidence">
              <code style={codeStyle}>{selected.evidence}</code>
            </Row>
            <Row label="Recommendation">
              <span style={{ color: "#111827" }}>{selected.recommendation}</span>
            </Row>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Compliance tip: document exceptions and time-bound approvals if public
              access is required.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Key Rotation / Expiration reminders
 * Lists aging API keys, certificates, and tokens with actionable rotation suggestions.
 */
function KeyRotationReminders() {
  // Mock credentials
  const creds = useMemo(
    () => [
      {
        id: "ak-aws-01",
        type: "API Key",
        provider: "AWS",
        name: "prod-app-ak",
        ageDays: 92,
        expiresInDays: null, // API Keys often no hard expiry
        status: "Aging",
        guidance:
          "Rotate keys every 90 days. Use IAM roles where possible to avoid static keys.",
      },
      {
        id: "cert-web",
        type: "TLS Certificate",
        provider: "Azure",
        name: "web-cert",
        ageDays: 340,
        expiresInDays: 20,
        status: "Expiring Soon",
        guidance:
          "Renew certificate and enable auto-rotation. Validate SAN entries and revocation.",
      },
      {
        id: "token-ci",
        type: "Access Token",
        provider: "AWS",
        name: "ci-token",
        ageDays: 12,
        expiresInDays: 3,
        status: "Expiring",
        guidance:
          "Reduce token lifetime and prefer short-lived, scoped tokens via OIDC.",
      },
    ],
    []
  );

  const [popoverOpenId, setPopoverOpenId] = useState(null);
  const anchors = useRef({});

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Mock data: replace with secrets manager/PKI feeds.
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, minmax(220px, 1fr))" }}>
        {creds.map((c) => (
          <div
            key={c.id}
            className="stat-card"
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              padding: 14,
              display: "grid",
              gap: 6,
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
              {c.type}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
              {c.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {c.provider} • Age {c.ageDays}d
              {typeof c.expiresInDays === "number" ? ` • Expires in ${c.expiresInDays}d` : ""}
            </div>
            <div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn primary"
                onClick={() => alert("TODO: Start rotation workflow")}
              >
                Rotate
              </button>
              <button
                ref={(el) => (anchors.current[c.id] = el)}
                className="btn"
                onClick={() => setPopoverOpenId((v) => (v === c.id ? null : c.id))}
              >
                Tips
              </button>
              <div style={{ position: "relative" }}>
                <Popover
                  open={popoverOpenId === c.id}
                  onClose={() => setPopoverOpenId(null)}
                  anchorRef={{ current: anchors.current[c.id] }}
                  ariaLabel="Rotation tips"
                >
                  <div
                    className="panel"
                    style={{
                      padding: 10,
                      background: "#FFFFFF",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      maxWidth: 320,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Compliance Tip</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.guidance}
                    </div>
                  </div>
                </Popover>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * IAM Policy Clarity
 * Shows inferred access patterns vs. granted policies and suggestions to tighten scope.
 */
function IamPolicyClarity() {
  // Mock signals: observed actions vs. current policy scope
  const items = useMemo(
    () => [
      {
        id: "role-app",
        principal: "role/app-backend",
        provider: "AWS",
        observed: ["s3:GetObject", "s3:PutObject"],
        granted: ["s3:*"],
        resources: ["arn:aws:s3:::app-bucket/*"],
        suggestion:
          "Replace s3:* with s3:GetObject and s3:PutObject only. Scope to specific prefixes if possible.",
        impact: "Reduce blast radius, adhere to least privilege.",
      },
      {
        id: "mi-az",
        principal: "mi/webapp",
        provider: "Azure",
        observed: ["Microsoft.Compute/virtualMachines/read"],
        granted: ["Microsoft.Compute/*"],
        resources: ["/subscriptions/xxx/resourceGroups/rg-prod/providers/Microsoft.Compute/virtualMachines/*"],
        suggestion:
          "Use read-only role instead of wildcard. Limit scope to RG and VM resources in use.",
        impact: "Prevents unintended writes/deletes.",
      },
    ],
    []
  );

  const [open, setOpen] = useState(null);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Mock analysis: replace with access logs and IAM policy diff from providers.
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div
            key={it.id}
            className="panel"
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "#FFFFFF",
              boxShadow: "var(--shadow)",
            }}
          >
            <div className="panel-header">
              <div className="panel-title">{it.principal} — {it.provider}</div>
              <button className="btn" onClick={() => setOpen(it)}>Review</button>
            </div>
            <div className="panel-body" style={{ display: "grid", gap: 6 }}>
              <Row label="Observed">{it.observed.join(", ")}</Row>
              <Row label="Granted">{it.granted.join(", ")}</Row>
              <Row label="Resources">
                <code style={codeStyle}>{it.resources.join(", ")}</code>
              </Row>
              <Row label="Recommendation">
                <span style={{ color: "#111827" }}>{it.suggestion}</span>
              </Row>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={open ? `IAM Suggestion — ${open.principal}` : "IAM Suggestion"}
        open={!!open}
        onClose={() => setOpen(null)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setOpen(null)}>Close</button>
            <button
              className="btn primary"
              onClick={() => {
                alert("TODO: Generate policy patch / PR");
                setOpen(null);
              }}
            >
              Generate Policy Patch
            </button>
          </>
        }
      >
        {open && (
          <div style={{ display: "grid", gap: 10 }}>
            <Row label="Observed">{open.observed.join(", ")}</Row>
            <Row label="Granted">{open.granted.join(", ")}</Row>
            <Row label="Resources">
              <code style={codeStyle}>{open.resources.join(", ")}</code>
            </Row>
            <Row label="Suggested Change">
              <span style={{ color: "#111827" }}>{open.suggestion}</span>
            </Row>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Action: apply patch to align policy with observed usage, then monitor for denials.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Small helper components and styles */
function Row({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "baseline" }}>
      <div className="text-xs" style={{ color: "var(--muted)", fontWeight: 600 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function ExposureCard({ item, onInspect }) {
  const riskColor =
    item.risk === "High" ? "#EF4444" : item.risk === "Medium" ? "#F59E0B" : "#10B981";
  const badgeBg =
    item.risk === "High"
      ? "rgba(239,68,68,0.10)"
      : item.risk === "Medium"
      ? "rgba(245,158,11,0.10)"
      : "rgba(16,185,129,0.10)";

  return (
    <div
      className="stat-card"
      style={{
        borderRadius: 12,
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        padding: 14,
        display: "grid",
        gap: 6,
        boxShadow: "var(--shadow)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
        {item.type}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
        {item.name} <span style={{ color: "var(--muted)", fontSize: 13 }}>• {item.provider}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <RiskBadge level={item.risk} />
        <div className="text-xs" style={{ color: "var(--muted)" }}>{item.issue}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn primary" onClick={onInspect}>Details</button>
        <button className="btn" onClick={() => alert("TODO: Open remediation playbook")}>Remediate</button>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const color =
    level === "High" ? "#EF4444" : level === "Medium" ? "#F59E0B" : "#10B981";
  const bg =
    level === "High"
      ? "rgba(239,68,68,0.12)"
      : level === "Medium"
      ? "rgba(245,158,11,0.12)"
      : "rgba(16,185,129,0.12)";
  return (
    <span
      className="badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        color,
        background: bg,
        border: `1px solid ${color}`,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      {level}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Expiring Soon": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    Expiring: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
    Aging: { color: "#374151", bg: "rgba(55,65,81,0.10)" },
    Healthy: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  };
  const s = map[status] || map.Healthy;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}`,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

const codeStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "2px 6px",
  display: "inline-block",
  color: "#111827",
};
