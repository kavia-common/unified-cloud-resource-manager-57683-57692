import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";
import { getAwsCosts, getAzureCosts, getGcpCosts } from "../../lib/cloudApi";
import { toCsv, downloadCsv } from "../../lib/csv";
import FilterBar from "../../components/ui/Filters";
import { TrendLineChart, StackedBarChart, PieBreakdownChart } from "../../components/ui/Charts";

/** Costs analytics panel with stats, filters, trends and breakdown tables/charts. */
export default function Costs() {
  const [daily, setDaily] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [delta, setDelta] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const [filters, setFilters] = useState({
    provider: "",
    account: "",
    region: "",
    service: "",
    tag: "",
    from: "",
    to: "",
  });

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
    // Pass filters to the RPCs when supported; fall back to demo values.
    const agg = await safeRpc("costs_aggregates", {
      provider: filters.provider || null,
      account: filters.account || null,
      region: filters.region || null,
      service: filters.service || null,
      tag: filters.tag || null,
      from: filters.from || null,
      to: filters.to || null,
    });
    if (agg) {
      setDaily(agg.daily || 0);
      setMonthly(agg.monthly || 0);
      setDelta(agg.delta_pct || 0);
    } else {
      setDaily(123.45);
      setMonthly(2789.12);
      setDelta(6.3);
    }

    let query = supabase.from("costs_breakdown").select("*");
    if (filters.provider) query = query.eq("provider", filters.provider);
    if (filters.account) query = query.eq("account_name", filters.account);
    if (filters.region) query = query.eq("region", filters.region);
    if (filters.service) query = query.eq("service", filters.service);
    if (filters.tag) query = query.contains?.("tags", [filters.tag]) || query;

    const { data, error } = await query.order("amount", { ascending: false });

    if (!error && Array.isArray(data)) setBreakdown(data);
    else setBreakdown([]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.provider, filters.account, filters.region, filters.service, filters.tag, filters.from, filters.to]);

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

  // PUBLIC_INTERFACE
  function exportBreakdownCsv() {
    /** Export the DB-driven cost breakdown to CSV using lib/csv helpers. */
    const headers = [
      { key: "provider", label: "Provider" },
      { key: "account_name", label: "Account" },
      { key: "service", label: "Service" },
      { key: "amount", label: "Monthly ($)" },
    ];
    const rows = (breakdown || []).map((r) => ({
      provider: r.provider ?? "",
      account_name: r.account_name ?? "",
      service: r.service ?? "",
      amount:
        typeof r.amount === "number"
          ? r.amount.toFixed(2)
          : r.amount ?? "",
    }));
    const csv = toCsv(headers, rows);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `costs_breakdown_${ts}.csv`;
    downloadCsv(filename, csv);
  }

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

  // Derived insights for current filters
  const providerTotals = useMemo(() => {
    const map = {};
    for (const r of breakdown) {
      const k = r.provider || "unknown";
      map[k] = (map[k] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [breakdown]);

  const serviceTotals = useMemo(() => {
    const map = {};
    for (const r of breakdown) {
      const k = r.service || "other";
      map[k] = (map[k] || 0) + Number(r.amount || 0);
    }
    // top 6 services + "Other"
    const items = Object.entries(map).sort((a,b)=>b[1]-a[1]);
    const top = items.slice(0,5);
    const otherSum = items.slice(5).reduce((s, [,v])=>s+v, 0);
    const result = top.map(([name, value])=>({ name, value: Number(value.toFixed(2)) }));
    if (otherSum > 0) result.push({ name: "Other", value: Number(otherSum.toFixed(2)) });
    return result;
  }, [breakdown]);

  // Simulated daily trend curve when backend trend not available
  const [trend, setTrend] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // try fetch from a view 'costs_daily' with optional filters; else synthesize
      let query = supabase.from("costs_daily").select("*").order("date", { ascending: true });
      if (filters.provider) query = query.eq("provider", filters.provider);
      if (filters.account) query = query.eq("account_name", filters.account);
      if (filters.region) query = query.eq("region", filters.region);
      if (filters.service) query = query.eq("service", filters.service);
      const { data, error } = await query.limit(60);
      if (!cancelled && !error && Array.isArray(data) && data.length) {
        setTrend(data.map((d)=>({ date: d.date?.slice(5) || d.date, value: Number(d.amount || d.value || 0) })));
      } else if (!cancelled) {
        // synthesize 30-day gentle slope based on monthly
        const days = 30;
        const base = monthly / days;
        const arr = new Array(days).fill(0).map((_,i)=>({
          date: new Date(Date.now() - (days - i - 1)*86400000).toISOString().slice(5,10),
          value: Number((base * (0.9 + Math.random()*0.2)).toFixed(2)),
        }));
        setTrend(arr);
      }
    })();
    return () => { cancelled = true; };
  }, [monthly, filters.provider, filters.account, filters.region, filters.service]);

  // Options - attempt to load from DB, else derive from rows
  const [options, setOptions] = useState({ providers: [], accounts: [], regions: [], services: [], tags: [] });
  useEffect(() => {
    (async () => {
      const [pA, aA, rA, sA, tA] = await Promise.allSettled([
        supabase.from("providers").select("id,name"),
        supabase.from("cloud_accounts").select("id,name"),
        supabase.from("regions").select("name"),
        supabase.from("services").select("name"),
        supabase.from("tags").select("name"),
      ]);
      const providers = pA.value?.data?.map((x)=>({ value: x.name || x.id, label: x.name || x.id })) || [
        { value: "aws", label: "AWS" },
        { value: "azure", label: "Azure" },
        { value: "gcp", label: "GCP" },
      ];
      const accounts = aA.value?.data?.map((x)=>({ value: x.name || x.id, label: x.name || x.id })) || [];
      const regions = rA.value?.data?.map((x)=>({ value: x.name, label: x.name })) || [
        { value: "us-east-1", label: "us-east-1" },
        { value: "us-west-2", label: "us-west-2" },
      ];
      const services = sA.value?.data?.map((x)=>({ value: x.name, label: x.name })) || [];
      const tags = tA.value?.data?.map((x)=>({ value: x.name, label: x.name })) || [];
      setOptions({ providers, accounts, regions, services, tags });
    })();
  }, []);

  // Spend insights
  const insights = useMemo(() => {
    const total = providerTotals.reduce((s, x)=>s + x.value, 0);
    const topProvider = providerTotals.slice().sort((a,b)=>b.value-a.value)[0];
    const topService = serviceTotals.slice().sort((a,b)=>b.value-a.value)[0];
    return {
      total,
      topProvider: topProvider?.name,
      topService: topService?.name,
      concentration: topProvider && total ? Math.round((topProvider.value/total)*100) : 0,
    };
  }, [providerTotals, serviceTotals]);

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

      <FilterBar
        values={filters}
        onChange={setFilters}
        providerOptions={options.providers}
        accountOptions={options.accounts}
        regionOptions={options.regions}
        serviceOptions={options.services}
        tagOptions={options.tags}
      />

      <div
        className="card-grid"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      >
        <div style={{ gridColumn: "span 8" }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Daily Spend Trend</div>
              <div className="badge">Trend</div>
            </div>
            <div className="panel-body">
              <TrendLineChart data={trend} dataKey="value" xKey="date" gradient color="#3B82F6" />
            </div>
          </div>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Spend by Provider</div>
              <div className="badge">Share</div>
            </div>
            <div className="panel-body">
              <PieBreakdownChart data={providerTotals} dataKey="value" nameKey="name" />
              <div style={{ textAlign: "center", color: "var(--muted)", marginTop: 6 }}>
                {insights.topProvider ? `Top: ${insights.topProvider} (${insights.concentration}%)` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="card-grid"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
      >
        <div style={{ gridColumn: "span 12" }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Top Services (stacked by provider)</div>
              <div className="badge">Breakdown</div>
            </div>
            <div className="panel-body">
              {/*
                Prepare data for stacked chart: x = service, stacks = providers
              */}
              <StackedBarChart
                data={(() => {
                  const services = {};
                  breakdown.forEach((r) => {
                    const svc = r.service || "other";
                    const prov = r.provider || "unknown";
                    services[svc] = services[svc] || { name: svc };
                    services[svc][prov] = (services[svc][prov] || 0) + Number(r.amount || 0);
                  });
                  // limit to top 10 by total
                  return Object.values(services)
                    .map((row) => ({
                      ...row,
                      _total: Object.entries(row).reduce((s, [k, v]) => (k !== "name" ? s + (v || 0) : s), 0),
                    }))
                    .sort((a, b) => b._total - a._total)
                    .slice(0, 10)
                    .map(({ _total, ...rest }) => rest);
                })()}
                keys={[...new Set(breakdown.map((r) => r.provider || "unknown"))]}
                colors={["#374151", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"]}
                xKey="name"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Cost Breakdown (tabular)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={exportBreakdownCsv}>Export CSV</button>
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
