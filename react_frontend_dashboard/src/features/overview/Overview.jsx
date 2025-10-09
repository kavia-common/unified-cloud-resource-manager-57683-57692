/* eslint-disable no-console */
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
import HealthcheckBanner from "../../components/dev/HealthcheckBanner";

import AddAccountMinimalModal from "../../components/ui/AddAccountMinimalModal.jsx";
import { TopRecommendations } from "../../components/TopRecommendations";
import { RecommendationDetailsModal } from "../../components/recommendations";
// Adaptive imports
import { computeAdaptivePlan } from "../../lib/adaptivePolicy";
import { getRecentRuns } from "../../lib/historyProvider";

/* PUBLIC_INTERFACE */
export default function Overview() {
  /**
   * Overview dashboard with a curved-edge banner header, key stats, and a styled comparison chart per design.
   * Enhancement: Dynamic axes/labels for Daily/Monthly/Yearly with mock data.
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

  // Modal state for Top Recommendations details
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);

  // Embedded preflight state for unified Run Optimization flow
  const [showRunPreflight, setShowRunPreflight] = useState(false);
  const [adaptiveEnabledInternal, setAdaptiveEnabledInternal] = useState(false);
  const [adaptivePlan, setAdaptivePlan] = useState(null);
  const [adaptiveComputing, setAdaptiveComputing] = useState(false);

  const handleOpenRecDetails = (rec) => {
    console.debug('[Overview] Opening recommendation details modal for:', rec?.id || rec?.title);
    setSelectedRec(rec);
    setIsRecModalOpen(true);
  };

  const handleCloseRecDetails = () => {
    setIsRecModalOpen(false);
  };

  // Build a lightweight current recommendation context by peeking at TopRecommendations DOM cache or fallback
  // For simplicity, we compute an aggregated synthetic recommendation when user toggles Adaptive ON.
  async function computeDashboardAdaptivePlan() {
    try {
      setAdaptiveComputing(true);
      // Attempt to derive a generic recommendation context leaning towards 'rightsizing'
      const syntheticRec = {
        id: undefined,
        type: 'rightsizing',
        riskLevel: 'high', // dashboard top items are high-priority
        estimatedSavingsPct: 9, // a mid-range estimate; refined when real table context is available
        requiresApproval: false,
        tags: ['dashboard', 'top-recs'],
      };

      // Fetch recent runs filtered by type to inform policy
      const history = await getRecentRuns({ recommendationType: syntheticRec.type, limit: 25 }).catch(() => []);
      const safeHistory = Array.isArray(history) ? history : [];

      const plan = computeAdaptivePlan({
        recommendation: syntheticRec,
        history: safeHistory,
        context: {
          blackoutActive: false,
          complianceFlag: false,
          defaultBlastRadius: 'smart-subset',
          businessHoursLocal: true,
        },
      });

      setAdaptivePlan(plan);
    } catch (e) {
      console.warn('[Overview] Adaptive plan computation failed; using fallback.', e?.message || e);
      setAdaptivePlan({
        aggressiveness: 'conservative',
        scope: 'canary',
        scheduleHint: 'off-hours',
        confidence: 0.45,
        expectedSavingsDelta: { minPct: 2, maxPct: 6 },
        rationale: 'Fallback plan due to missing data; using conservative defaults.',
        safeguards: {
          requireApproval: false,
          capScopeToCanary: true,
          respectBlackout: false,
          blastRadiusMax: 'smart-subset',
        },
      });
    } finally {
      setAdaptiveComputing(false);
    }
  }

  // Local UI state to control the portal-based minimal Add Account modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Mini panels
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const navigate = useNavigate();

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

  // Initialize with Monthly mock data and fetch linked accounts
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
        showToast("Could not load linked accounts.", { type: "info", timeout: 2500 });
        const all = getAccounts();
        setExistingAccounts(all);
        setStats((prev) => ({ ...prev, ...computeStatsFromAccounts(prev) }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Axis config helpers and mode handling removed here for brevity (chart not shown in this trimmed file)

  // PUBLIC_INTERFACE
  // Run handler with optional adaptive plan. Keeps legacy path intact if no adaptive.
  const handleRun = async (rec, options) => {
    const adaptive = options?.adaptive;

    // Respect minimal guardrails even if caller skips
    const payload = {
      recommendationId: rec?.id,
      type: rec?.type || rec?.category,
      // Default params if adaptive not provided
      params: adaptive
        ? {
            aggressiveness: adaptive.aggressiveness,
            scope: adaptive.scope,
            scheduleHint: adaptive.scheduleHint,
            expectedSavingsRangePct: adaptive.expectedSavingsDelta,
            confidence: adaptive.confidence,
            safeguards: adaptive.safeguards,
          }
        : {
            aggressiveness: 'conservative',
            scope: 'canary',
            scheduleHint: 'off-hours',
          },
    };

    // Never exceed defined blast radius defaults on client side
    if (adaptive) {
      const allowed = { 'canary': 0, 'smart-subset': 1, 'all': 2 };
      const maxIdx = allowed[adaptive.safeguards.blastRadiusMax];
      if (allowed[payload.params.scope] > maxIdx) {
        payload.params.scope = adaptive.safeguards.blastRadiusMax;
      }
      if (adaptive.safeguards.capScopeToCanary) {
        payload.params.scope = 'canary';
      }
      if (adaptive.safeguards.respectBlackout) {
        payload.params.scheduleHint = 'maintenance';
      }
    }

    // Existing execution path (placeholder) - integrate with API/Edge Function here
    console.log('Running optimization payload', payload);
  };

  // PUBLIC_INTERFACE
  function capitalize(str) {
    /** Capitalize the first letter of a string. */
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // PUBLIC_INTERFACE
  function windowLabel(hint) {
    /** Map internal schedule hint to a user-friendly label. */
    if (!hint) return 'Off-hours';
    const map = {
      'off-hours': 'Off-hours',
      'maintenance': 'Maintenance window',
      'business': 'Business hours',
    };
    return map[hint] || capitalize(hint);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* TEMP DEV Healthcheck - visible banner to confirm render and routing. */}
      <HealthcheckBanner />

      <Banner title="Welcome back!" subtitle="Manage, monitor, and optimize your cloud with ease" align="left" />

      {/* Centered modal for recommendation details */}
      <RecommendationDetailsModal
        isOpen={isRecModalOpen}
        onClose={handleCloseRecDetails}
        selectedRow={selectedRec}
        onRun={handleRun}
        context={{
          blackoutActive: false, // wire actual context if available
          complianceFlag: false,
          defaultBlastRadius: 'smart-subset',
          businessHoursLocal: true,
        }}
      />

      {/* Key metrics */}
      <div className="card-grid" aria-label="Key metrics" style={{ marginTop: 4 }}>
        <StatCard title="Active Cloud Accounts" value={stats.accounts} onClick={() => setShowAccounts(true)} />
        <StatCard title="Total Resources" value={stats.resources} onClick={() => setShowResources(true)} />
        <StatCard title="Daily Spend" value={`$${Number(stats.daily).toFixed(2)}`} onClick={() => setShowDailySpend(true)} />
        <StatCard title="Open Recommendations" value={stats.recs} onClick={() => setShowRecs(true)} />
      </div>

      {/* Top Recommendations section */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="panel-header">
          <div className="panel-title">Top Recommendations</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            High-risk, actionable with confidence
          </div>
        </div>
        <div className="panel-body">
          <TopRecommendations onViewDetails={handleOpenRecDetails} />
        </div>
      </div>

      {/* Actions placed directly below Top Recommendations */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: 840, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Single Run Optimization button opens embedded preflight */}
          <button
            type="button"
            aria-label="Run Optimization"
            data-testid="btn-run-optimization-dashboard"
            onClick={() => {
              setShowRunPreflight(true);
            }}
            className="btn"
            style={{
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              background: "#FFFFFF",
              color: "#374151",
              transition: "background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .05s ease"
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#F3F4F6", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "#FFFFFF", transform: "none", boxShadow: "none" })}
            onFocus={(e) => Object.assign(e.currentTarget.style, { boxShadow: "0 0 0 3px rgba(59,130,246,0.25)", borderColor: "#93C5FD" })}
            onBlur={(e) => Object.assign(e.currentTarget.style, { boxShadow: "none", borderColor: "#E5E7EB" })}
          >
            Run Optimization
          </button>

          {/* Keep existing Add Account entry point for convenience */}
          <button
            className="btn primary"
            onClick={() => setIsAddOpen(true)}
            aria-label="Add Account"
            data-testid="overview-add-account-below-recs"
            style={{ marginLeft: 4 }}
          >
            Add Account
          </button>
        </div>
      </div>

      {/* Preflight modal for Run Optimization */}
      <Modal
        title="Run optimization"
        open={showRunPreflight}
        onClose={() => {
          setShowRunPreflight(false);
          setAdaptiveEnabledInternal(false);
          setAdaptivePlan(null);
        }}
        footer={
          <>
            <button
              className="btn"
              onClick={() => {
                setShowRunPreflight(false);
                setAdaptiveEnabledInternal(false);
                setAdaptivePlan(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                const rec = selectedRec || { id: undefined, type: 'rightsizing', category: 'rightsizing' };
                const options = adaptiveEnabledInternal && adaptivePlan ? { adaptive: adaptivePlan } : undefined;
                handleRun(rec, options);
                setShowRunPreflight(false);
                setAdaptiveEnabledInternal(false);
                setAdaptivePlan(null);
              }}
              disabled={adaptiveEnabledInternal && adaptiveComputing}
            >
              {adaptiveEnabledInternal && adaptiveComputing ? 'Preparing…' : 'Confirm & Run'}
            </button>
          </>
        }
      >
        <div className="preflight-wrapper">
          {/* Header wrapper for alignment and minimalist spacing */}
          <div className="preflight-header" role="group" aria-label="Run optimization preflight header">
            <h3 className="preflight-title">Run optimization</h3>
            <p className="preflight-sub">
              Review mode before executing. You can enable Adaptive Optimization to tailor aggressiveness,
              scope, schedule, and safeguards automatically based on recent outcomes.
            </p>
          </div>

          {/* Adaptive section */}
          <div className="adaptive-row">
            <label className="adaptive-toggle">
              <input
                type="checkbox"
                checked={adaptiveEnabledInternal}
                onChange={async (e) => {
                  const on = e.target.checked;
                  setAdaptiveEnabledInternal(on);
                  if (on) {
                    await computeDashboardAdaptivePlan();
                  } else {
                    setAdaptivePlan(null);
                  }
                }}
                aria-label="Toggle Adaptive mode"
              />
              <span className="adaptive-toggle-label">Adaptive mode</span>
            </label>

            {adaptiveEnabledInternal && (
              <div className="adaptive-status" aria-live="polite">
                {/* Normalize copy: Confidence • Plan • Window • Rationale */}
                <span className="adaptive-chip" title="Adaptive plan confidence">
                  {adaptiveComputing ? "…" : `Confidence: ${Math.round(((adaptivePlan?.confidence ?? 0) * 100))}%`}
                </span>
                <span className="adaptive-dot" aria-hidden="true">•</span>
                <span className="adaptive-chip" title="Execution plan scope and aggressiveness">
                  {adaptiveComputing
                    ? "Plan: …"
                    : `Plan: ${adaptivePlan?.aggressiveness ? capitalize(adaptivePlan.aggressiveness) : 'Conservative'} (${adaptivePlan?.scope || 'canary'})`}
                </span>
                <span className="adaptive-dot" aria-hidden="true">•</span>
                <span className="adaptive-chip" title="Scheduling window">
                  {adaptiveComputing
                    ? "Window: …"
                    : `Window: ${windowLabel(adaptivePlan?.scheduleHint)}`
                  }
                </span>
                <span className="adaptive-dot" aria-hidden="true">•</span>
                <span className="adaptive-rationale" title={adaptivePlan?.rationale || "Adaptive rationale"}>
                  {adaptiveComputing
                    ? "Rationale: computing…"
                    : `Rationale: ${adaptivePlan?.rationale || "based on safety defaults"}`}
                </span>
              </div>
            )}
          </div>

          <div className="preflight-tip">
            Tip: You can open a recommendation row to see full details before running.
          </div>
        </div>

        {/* Local helpers for display formatting */}
        <style>{`
          .preflight-wrapper {
            display: grid;
            gap: 12px;
          }
          .preflight-header {
            display: grid;
            gap: 6px;
            padding: 0 12px;
            text-align: center;
          }
          .preflight-title {
            margin: 0;
            font-size: 16px;
            line-height: 1.3;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.01em;
          }
          .preflight-sub {
            margin: 0;
            color: #6B7280;
            font-size: 13px;
          }
          .adaptive-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px 12px;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            background: #FFFFFF;
          }
          .adaptive-toggle {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #111827;
            user-select: none;
            padding-top: 2px;
          }
          .adaptive-toggle input[type="checkbox"] {
            inline-size: 16px;
            block-size: 16px;
            accent-color: #374151;
          }
          .adaptive-toggle-label {
            font-size: 13px;
            font-weight: 600;
          }
          .adaptive-status {
            display: inline-flex;
            flex-wrap: wrap;
            row-gap: 4px;
            column-gap: 8px;
            align-items: center;
            min-height: 24px;
            max-width: 100%;
          }
          .adaptive-chip {
            font-size: 12px;
            color: #111827;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 999px;
            padding: 4px 8px;
            white-space: nowrap;
          }
          .adaptive-dot {
            color: #9CA3AF;
            font-size: 12px;
            line-height: 1;
            margin: 0 2px;
          }
          .adaptive-rationale {
            font-size: 12px;
            color: #6B7280;
            max-width: 520px;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            line-height: 1.4;
          }
          .preflight-tip {
            font-size: 12px;
            color: #9CA3AF;
            padding: 0 12px;
          }
        `}</style>
      </Modal>

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
        {/* Placeholder content - kept minimal */}
        <div className="text-xs" style={{ color: "var(--muted)" }}>No linked accounts.</div>
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
            <button className="btn" style={{ backgroundColor: "#000000", color: "#FFFFFF" }} onClick={() => setShowDailySpend(false)}>
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
            const authed = await isAuthenticated();
            if (authed) {
              await createLinkedAccount({
                provider: payload.provider,
                name: payload.name,
                credentials: payload.credentials,
              });
              const backendAccounts = await getLinkedAccounts();
              setAccounts(backendAccounts || []);
            } else {
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

            const all = getAccounts();
            setExistingAccounts(all);
            setStats((prev) => ({
              ...prev,
              ...computeStatsFromAccounts(prev),
            }));

            showToast("Account has been created successfully", { type: "success", timeout: 3500 });
          } catch (err) {
            console.error("Create account failed:", err);
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
              showToast("Invalid Credentials, try again.", { type: "error", timeout: 4000 });
              throw err;
            }
          }
        }}
      />

      {/* Minimal Add Account Modal wired to local state; rendered via portal (no layout impact) */}
      <AddAccountMinimalModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={(data) => {
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
