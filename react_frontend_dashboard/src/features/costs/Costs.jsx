import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { DataTable } from "../../components/ui/Table";
import StatCard from "../../components/ui/StatCard";

/** Costs analytics panel with simple stats and breakdown table. */
export default function Costs() {
  const [daily, setDaily] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [delta, setDelta] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  // Helper: safe RPC call that follows Supabase JS v2 pattern
  async function safeRpc(fnName, params) {
    try {
      // Supabase v2: rpc returns a resolved promise with { data, error }
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
    // Aggregations (function/table might not exist; handle gracefully)
    const agg = await safeRpc("costs_aggregates");
    if (agg) {
      setDaily(agg.daily || 0);
      setMonthly(agg.monthly || 0);
      setDelta(agg.delta_pct || 0);
    } else {
      // Fallback demo values
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

  const columns = [
    { key: "provider", label: "Provider" },
    { key: "account_name", label: "Account" },
    { key: "service", label: "Service" },
    { key: "amount", label: "Monthly ($)", render: (v) => (v ? v.toFixed?.(2) ?? v : 0) },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card-grid">
        <StatCard
          label="Daily Spend"
          value={`$${daily.toFixed(2)}`}
          deltaLabel={`${delta.toFixed(1)}% vs 7d`}
          deltaType={delta >= 0 ? "up" : "down"}
        />
        <StatCard label="Projected Month" value={`$${monthly.toFixed(2)}`} deltaLabel="Projection" />
        <StatCard label="High-Cost Accounts" value="3" deltaLabel="Top 10%" />
        <StatCard label="Idle Spend Est." value="$214.90" deltaLabel="Potential save" />
      </div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Cost Breakdown</div>
          <div>
            <button className="btn">Export CSV</button>
          </div>
        </div>
        <div className="panel-body">
          <DataTable columns={columns} rows={breakdown} emptyMessage="No cost data yet." />
        </div>
      </div>
    </div>
  );
}
