import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";
import { getAwsCosts, getAzureCosts, getGcpCosts } from "../../lib/cloudApi";

/** Costs analytics panel with simple stats and breakdown table. */
export default function Costs() {
  const [daily, setDaily] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [delta, setDelta] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  // Helper: safe RPC call that follows Supabase JS v2 pattern
  async function safeRpc(fnName, params) {
    try {
      const { data, error } = await supabase.rpc(fnName, params);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(`RPC ${fnName} failed:`, error.message);
        return null;
      }
      return data ?? null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`RPC ${fnName} threw:`, e?.message || e);
      return null;
    }
  }

  async function load() {
    const agg = await safeRpc("costs_aggregates");
    if (agg) {
      setDaily(agg.daily || 0);
      setMonthly(agg.monthly || 0);
      setDelta(agg.delta_pct || 0);
    } else {
      setDaily(123.45);
      setMonthly(2789.12);
      setDelta(6.3);
    }

    const { data, error } = await supabase
      .from("costs_breakdown")
      .select("*")
      .order("amount", { ascending: false });

    if (!error && Array.isArray(data)) setBreakdown(data);
    else setBreakdown([]);
  }

  useEffect(() => {
    load();
  }, []);

  const breakdownColumns = [
    { key: "provider", label: "Provider" },
    { key: "account_name", label: "Account" },
    { key: "service", label: "Service" },
    {
      key: "amount",
      label: "Monthly ($)",
      render: (v) => (v ? v.toFixed?.(2) ?? v : 0),
    },
  ];

  // Mock Costs from Edge Functions
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState("");
  const [mockCosts, setMockCosts] = useState({
    aws: null,
    azure: null,
    gcp: null,
  });

  async function loadMockCosts() {
    setMockLoading(true);
    setMockError("");
    try {
      const [aws, azure, gcp] = await Promise.all([
        getAwsCosts(),
        getAzureCosts(),
        getGcpCosts(),
      ]);
      setMockCosts({
        aws: aws.data || null,
        azure: azure.data || null,
        gcp: gcp.data || null,
      });
      if (aws.error || azure.error || gcp.error) {
        const err =
          aws.error?.message ||
          azure.error?.message ||
          gcp.error?.message ||
          "Unknown error";
        setMockError(err);
      }
    } finally {
      setMockLoading(false);
    }
  }

  function renderBreakdownTable(payload) {
    if (!payload || !payload.breakdown) return null;
    const rows = Object.entries(payload.breakdown).map(([service, amount]) => ({
      service,
      amount: Number(amount || 0),
    }));
    const columns = [
      { key: "service", label: "Service" },
      {
        key: "amount",
        label: "Monthly ($)",
        render: (v) => Number(v).toFixed(2),
      },
    ];
    return (
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No breakdown available."
      />
    );
  }

  function renderProviderCostCard(provider, payload) {
    if (!payload) {
      return (
        <div className="card">
          <div className="panel-title" style={{ marginBottom: 6 }}>
            {provider.toUpperCase()}
          </div>
          <div className="badge">No data</div>
        </div>
      );
    }
    const total = Number(payload.total || 0).toFixed(2);
    return (
      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
        >
          <div className="panel-title">{provider.toUpperCase()}</div>
          <div className="badge">Month: {payload.month || "-"}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>${total}</div>
        <div style={{ color: "var(--muted)" }}>
          Services: {Object.keys(payload.breakdown || {}).length}
        </div>
        <div style={{ height: 8 }} />
        <div
          className="panel"
          style={{
            border: "1px solid var(--border)",
            background: "linear-gradient(to bottom right,#fff,var(--surface))",
          }}
        >
          <div className="panel-header">
            <div className="panel-title">Breakdown</div>
          </div>
          <div className="panel-body">{renderBreakdownTable(payload)}</div>
        </div>
      </div>
    );
  }

  const totalFromMock = useMemo(() => {
    const a = Number(mockCosts.aws?.total || 0);
    const z = Number(mockCosts.azure?.total || 0);
    const g = Number(mockCosts.gcp?.total || 0);
    return a + z + g;
  }, [mockCosts]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card-grid">
        <StatCard
          label="Daily Spend"
          value={`$${daily.toFixed(2)}`}
          deltaLabel={`${delta.toFixed(1)}% vs 7d`}
          deltaType={delta >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Projected Month"
          value={`$${monthly.toFixed(2)}`}
          deltaLabel="Projection"
        />
        <StatCard label="High-Cost Accounts" value="3" deltaLabel="Top 10%" />
        <StatCard
          label="Idle Spend Est."
          value="$214.90"
          deltaLabel="Potential save"
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Cost Breakdown</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn">Export CSV</button>
            <button className="btn" onClick={loadMockCosts} disabled={mockLoading}>
              {mockLoading ? "Loading mock costs..." : "Load mock cloud costs"}
            </button>
          </div>
        </div>
        <div className="panel-body">
          <DataTable
            columns={breakdownColumns}
            rows={breakdown}
            emptyMessage="No cost data yet."
          />

          <div style={{ height: 16 }} />

          <div className="panel" style={{ border: "1px dashed var(--border)" }}>
            <div className="panel-header">
              <div className="panel-title">
                Cloud Mock Costs (Edge Functions)
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {mockError && (
                  <div className="badge error">Error: {mockError}</div>
                )}
                <div className="badge">
                  Total: ${Number(totalFromMock).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="panel-body">
              <div
                className="card-grid"
                style={{ gridTemplateColumns: "repeat(12,minmax(0,1fr))" }}
              >
                <div className="card" style={{ gridColumn: "span 4" }}>
                  {renderProviderCostCard("aws", mockCosts.aws)}
                </div>
                <div className="card" style={{ gridColumn: "span 4" }}>
                  {renderProviderCostCard("azure", mockCosts.azure)}
                </div>
                <div className="card" style={{ gridColumn: "span 4" }}>
                  {renderProviderCostCard("gcp", mockCosts.gcp)}
                </div>
              </div>
              <div style={{ marginTop: 10, color: "var(--muted)" }}>
                Data sourced from mock-aws, mock-azure, and mock-gcp Edge Functions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
