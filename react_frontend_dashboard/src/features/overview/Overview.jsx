import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import Banner from "../../components/ui/Banner";
import { CLOUD_COLORS } from "../../components/ui/Charts";

import { Modal } from "../../components/ui/Modal";
import AddCloudAccountModal from "../../components/ui/AddCloudAccountModal";
import DiscoverResourcesModal from "../../components/ui/DiscoverResourcesModal";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { createLinkedAccount, getLinkedAccounts, isAuthenticated } from "../../services/api";
import { appendAccount, computeStatsFromAccounts, getAccounts, setAccounts } from "../../services/accountStore";
// TEMP DEV: Healthcheck banner to verify preview visibility.
// TODO: Remove HealthcheckBanner import and usage once preview is confirmed.
import HealthcheckBanner from "../../components/dev/HealthcheckBanner";
import ActionsBar from "../../components/common/ActionsBar.tsx";
import AddAccountMinimalModal from "../../components/ui/AddAccountMinimalModal.jsx";
import { TopRecommendations } from "../../components/TopRecommendations";
import { RecommendationDetailsDrawer } from "../../components/recommendations";

/* PUBLIC_INTERFACE */
export default function Overview() {
  /**
   * Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design.
   * Enhancement: Dynamic axes/labels for Daily/Monthly/Yearly with mock data.
   *
   * Linked accounts loading:
   * - If authenticated, fetch from Supabase and update stats.
   * - If unauthenticated (auth-less workflow), do not show error; render 0 accounts gracefully.
   */
  // Dashboard stats state - initialize with mock baseline
  const [stats, setStats] = useState({ resources: 128, accounts: 2, daily: 412.32, recs: 6 });
  const [mode, setMode] = useState("Monthly"); // Keep mode state for chart configuration
  const [chartData, setChartData] = useState([]);

  // Local modal states for the four stat cards
  const [showAccounts, setShowAccounts] = useState(false);
  const [showAddCloudModal, setShowAddCloudModal] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [showResources, setShowResources] = useState(false);
  const [showDailySpend, setShowDailySpend] = useState(false);
  const [showRecs, setShowRecs] = useState(false);

  // Drawer state for Top Recommendations details
  const [isRecDrawerOpen, setIsRecDrawerOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);

  const handleOpenRecDetails = (rec) => {
    // Minimal telemetry to aid debugging click wiring
    // eslint-disable-next-line no-console
    console.debug('[Overview] Opening recommendation details drawer for:', rec?.id || rec?.title);
    setSelectedRec(rec);
    setIsRecDrawerOpen(true);
  };

  const handleCloseRecDetails = () => {
    setIsRecDrawerOpen(false);
  };

  // Local UI state to control the portal-based minimal Add Account modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Mini panels
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const navigate = useNavigate();

  // One-click action modal states (removed: Add Account, Discover, Optimize)
  // const [showAddAccount, setShowAddAccount] = useState(false);
  // const [showDiscover, setShowDiscover] = useState(false);
  // const [showOptimize, setShowOptimize] = useState(false);

  // X-axis categories per mode
  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => h), []);
  const daysInMonth = useMemo(() => Array.from({ length: 31 }, (_, d) => d + 1), []);
  const months = useMemo(() => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], []);

  function rand(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  // Build data rows for current x-domain (will map into { name, series1, series2, series3 })
  function buildSeriesFor(xValues, ranges, nameFormatter = (x) => String(x)) {
    return xValues.map((x) => ({
      name: nameFormatter(x),
      series1: rand(ranges.s1[0], ranges.s1[1]),
      series2: rand(ranges.s2[0], ranges.s2[1]),
      series3: rand(ranges.s3[0], ranges.s3[1]),
    }));
  }

  // Compute axis configuration for the chart based on mode
  function computeAxisConfig(selectedMode) {
    if (selectedMode === "Daily") {
      return {
        xTickFormatter: (v) => `${v}:00`,
        xLabel: "Hour of Day",
        yLabel: "Spend ($)",
        yDomain: [0, 25],
        yTicks: [0, 5, 10, 15, 20, 25],
      };
    }
    if (selectedMode === "Monthly") {
      return {
        xTickFormatter: (v) => `${v}`,
        xLabel: "Day of Month",
        yLabel: "Spend ($)",
        yDomain: [0, 60],
        yTicks: [0, 10, 20, 30, 40, 50, 60],
      };
    }
    // Yearly
    return {
      xTickFormatter: (v) => v,
      xLabel: "Month",
      yLabel: "Spend ($)",
      yDomain: [0, 120],
      yTicks: [0, 20, 40, 60, 80, 100, 120],
    };
  }

  // Initialize with Monthly mock data and fetch linked accounts
  // Toast handler using context API
  const { show: showToast } = useToast();

  useEffect(() => {
    setChartData(buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`));
    // Fetch linked accounts from backend (auth-aware)
    (async () => {
      try {
        const authed = await isAuthenticated();
        if (!authed) {
          // Auth-less mode: use in-memory only
          setAccounts([]); // ensure empty seed
          setExistingAccounts(getAccounts());
          setStats((prev) => ({ ...prev, ...computeStatsFromAccounts(prev) }));
          return;
        }
        const accounts = await getLinkedAccounts();
        setAccounts(accounts || []);
        const all = getAccounts();
        setExistingAccounts(all);
        setStats((prev) => ({
          ...prev,
          ...computeStatsFromAccounts(prev),
        }));
      } catch (err) {
        console.warn("Failed to load linked accounts:", err?.message || err);
        // Only show toast for real errors when authenticated; info level to avoid alarming users.
        showToast("Could not load linked accounts.", { type: "info", timeout: 2500 });
        // Fall back to in-memory
        const all = getAccounts();
        setExistingAccounts(all);
        setStats((prev) => ({ ...prev, ...computeStatsFromAccounts(prev) }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when mode changes
  useEffect(() => {
    if (mode === "Daily") {
      setChartData(buildSeriesFor(hours, { s1: [2, 16], s2: [1, 14], s3: [3, 20] }, (h) => `${h}`));
    } else if (mode === "Monthly") {
      setChartData(buildSeriesFor(daysInMonth, { s1: [8, 40], s2: [6, 35], s3: [10, 50] }, (d) => `${d}`));
    } else if (mode === "Yearly") {
      setChartData(buildSeriesFor(months, { s1: [25, 90], s2: [20, 80], s3: [30, 100] }, (m) => m));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Minimalist select styling aligned with Pure White theme
  const selectStyles = {
    display: "inline-grid",
    alignItems: "center",
    gridAutoFlow: "column",
    gap: 8,
  };

  // Axis config for current mode
  const axis = computeAxisConfig(mode);

  // Styles for action buttons (reference CSS variables in theme.css)
  const actionBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
    padding: "10px 14px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .05s ease",
  };
  const iconTileBase = {
    width: 36,
    height: 36,
    minWidth: 36,
    display: "grid",
    placeItems: "center",
    background: "var(--tile-bg)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 10,
    marginRight: 12,
  };
  const actionLabelStyle = {
    fontFamily: "\"Helvetica Neue\", Arial, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    color: "var(--text-primary)",
    marginRight: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  };
  const chipBase = {
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: 999,
    background: "var(--chip-neutral)",
    color: "var(--text-secondary)",
  };



  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* TEMP DEV Healthcheck - visible banner to confirm render and routing.
          Follows Pure White theme with minimal styling. */}
      <HealthcheckBanner />

      <Banner
        title="Welcome back!"
        subtitle="Manage, monitor, and optimize your cloud with ease"
        align="left"
      />

      {/* Right-side drawer for recommendation details */}
      <RecommendationDetailsDrawer
        isOpen={isRecDrawerOpen}
        onClose={handleCloseRecDetails}
        recommendation={{
          // Provide fallback mapping to ensure summary shows as requested
          id: selectedRec?.id,
          title: selectedRec?.title || selectedRec?.name || 'Recommendation Details',
          cloudProvider:
            selectedRec?.cloudProvider ||
            selectedRec?.provider ||
            // Best effort: infer from environment/category if provided (not always available)
            (selectedRec?.category?.toLowerCase().includes('azure') ? 'Azure'
              : selectedRec?.category?.toLowerCase().includes('aws') ? 'AWS'
              : undefined),
          impactedServices:
            Array.isArray(selectedRec?.impactedServices)
              ? selectedRec?.impactedServices
              : (selectedRec?.services && Array.isArray(selectedRec?.services) ? selectedRec?.services : []),
        }}
      />

      {/* Key metrics */}
      <div className="card-grid" aria-label="Key metrics" style={{ marginTop: 4 }}>
        <StatCard
          title="Active Cloud Accounts"
          value={stats.accounts}
          onClick={() => setShowAccounts(true)}
        />
        <StatCard
          title="Total Resources"
          value={stats.resources}
          onClick={() => setShowResources(true)}
        />
        <StatCard
          title="Daily Spend"
          value={`$${Number(stats.daily).toFixed(2)}`}
          onClick={() => setShowDailySpend(true)}
        />
        <StatCard
          title="Open Recommendations"
          value={stats.recs}
          onClick={() => setShowRecs(true)}
        />
      </div>

      {/* Top Recommendations section (dynamic from Supabase) */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="panel-header">
          <div className="panel-title">Top Recommendations</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            High-risk, actionable with confidence
          </div>
        </div>
        <div className="panel-body">
          {/* Import the new component to render top 3 high-risk recommendations */}
          <TopRecommendations onViewDetails={handleOpenRecDetails} />
        </div>
      </div>

      {/* Actions placed directly below Top Recommendations */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <ActionsBar />
          {/* Wire Add Account CTA (below recommendations) to open the minimal portal modal.
              Maintain layout by inheriting existing classes and spacing. */}
          <button
            className="btn primary"
            onClick={() => setIsAddOpen(true)}
            aria-label="Add Account"
            data-testid="overview-add-account-below-recs"
            style={{ marginLeft: 8 }}
          >
            Add Account
          </button>
        </div>
      </div>

      {/* Responsive adjustments for very small devices: stack buttons */}
      <style>{`
        @media (max-width: 480px) {
          [data-testid="actions-bar"] {
            width: 100%;
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 8px !important;
          }
          [data-testid="actions-bar"] > button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* Modals for each stat card with placeholder content */}
      <Modal
        title="Linked Accounts"
        open={showAccounts}
        onClose={() => setShowAccounts(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowAccounts(false)}>Close</button>
            <button className="btn primary" onClick={() => setIsAddOpen(true)}>Add Account</button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Connected accounts summary:
        </p>
        {existingAccounts.length === 0 ? (
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            No linked accounts.
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {existingAccounts.map((acc, idx) => (
              <li key={idx}>{acc.provider}: {acc.name} ({acc.account_id})</li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        title="Discovered Resources"
        open={showResources}
        onClose={() => setShowResources(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowResources(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowResources(false)}>Open Inventory</button>
          </>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Compute: 58</li>
          <li>Storage: 42</li>
          <li>Databases: 16</li>
          <li>Networking: 12</li>
        </ul>
      </Modal>

      <Modal
        title="Daily Spend"
        open={showDailySpend}
        onClose={() => setShowDailySpend(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowDailySpend(false)}>Close</button>
            <button
              className="btn"
              style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
              onClick={() => setShowDailySpend(false)}
            >
              View Costs
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "#000000" }}>
          <div className="badge" style={{ color: "#000000" }}>AWS: $242.12</div>
          <div className="badge" style={{ color: "#000000" }}>Azure: $138.44</div>
          <div className="badge" style={{ color: "#000000" }}>GCP: $31.76</div>

        </div>
      </Modal>

      <Modal
        title="Open Recommendations"
        open={showRecs}
        onClose={() => setShowRecs(false)}
        footer={
          <>
            <button className="btn" onClick={() => setShowRecs(false)}>Close</button>
            <button className="btn primary" onClick={() => setShowRecs(false)}>View Recommendations</button>
          </>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Rightsize 12 VMs — est. save $420/mo</li>
          <li>Shut down 4 idle instances — est. save $180/mo</li>
          <li>Move 3 DBs to reserved — est. save $210/mo</li>
        </ul>
      </Modal>

      {/* Existing Add Cloud Account Modal remains for other flows */}
      <AddCloudAccountModal
        open={showAddCloudModal}
        onClose={() => setShowAddCloudModal(false)}
        existingAccounts={existingAccounts}
        onSubmit={async (payload) => {
          try {
            // Try to persist via backend only if authenticated; otherwise operate in-memory
            const authed = await isAuthenticated();
            if (authed) {
              await createLinkedAccount({
                provider: payload.provider,
                name: payload.name,
                credentials: payload.credentials,
              });
              // Re-seed from backend
              const backendAccounts = await getLinkedAccounts();
              setAccounts(backendAccounts || []);
            } else {
              // Create a mock account_id if not provided
              const mockId =
                (payload.credentials?.accountId) ||
                (payload.credentials?.subscriptionId) ||
                (payload.credentials?.accessKeyId?.slice(0, 12)) ||
                Math.random().toString(36).slice(2, 10);
              appendAccount({
                provider: payload.provider,
                name: payload.name,
                account_id: mockId,
              });
            }

            // Refresh UI from in-memory store (which is now merged/seeded)
            const all = getAccounts();
            setExistingAccounts(all);
            setStats((prev) => ({
              ...prev,
              ...computeStatsFromAccounts(prev),
            }));

            // Success toast
            showToast("Account has been created successfully", { type: "success", timeout: 3500 });
          } catch (err) {
            console.error("Create account failed:", err);
            // Keep in-memory append as ultimate fallback if backend fails
            try {
              const mockId =
                (payload.credentials?.accountId) ||
                (payload.credentials?.subscriptionId) ||
                (payload.credentials?.accessKeyId?.slice(0, 12)) ||
                Math.random().toString(36).slice(2, 10);
              appendAccount({
                provider: payload.provider,
                name: payload.name,
                account_id: mockId,
              });
              const all = getAccounts();
              setExistingAccounts(all);
              setStats((prev) => ({
                ...prev,
                ...computeStatsFromAccounts(prev),
              }));
              showToast("Saved locally (offline mode).", { type: "info", timeout: 3500 });
            } catch (_) {
              // Error toast
              showToast("Invalid Credentials, try again.", { type: "error", timeout: 4000 });
              throw err; // preserve rejection for modal if needed
            }
          }
        }}
      />

      {/* Minimal Add Account Modal wired to local state; rendered via portal (no layout impact) */}
      <AddAccountMinimalModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={(data) => {
          // Optionally update local store to reflect the newly added account in stats
          if (data?.provider && data?.name && data?.account_id) {
            appendAccount({
              provider: data.provider,
              name: data.name,
              account_id: data.account_id,
            });
            const all = getAccounts();
            setExistingAccounts(all);
            setStats((prev) => ({
              ...prev,
              ...computeStatsFromAccounts(prev),
            }));
          }
          setIsAddOpen(false);
        }}
      />

    </div>
  );
}
