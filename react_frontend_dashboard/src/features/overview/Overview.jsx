import React, { useEffect, useState } from "react";
import StatCard from "../../components/ui/StatCard";
import supabase from "../../lib/supabaseClient";
import EmptyState from "../../components/ui/EmptyState";
import { getCloudData } from "../../lib/cloudApi";

// PUBLIC_INTERFACE
export default function Overview({ onGoTo }) {
  /** Overview dashboard with quick stats. */
  const [stats, setStats] = useState({ resources: 0, accounts: 0, daily: 0, recs: 0 });

  // Helper aligned with Costs: safe RPC call
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

  useEffect(() => {
    async function load() {
      const [r1, r2, r3, r4] = await Promise.allSettled([
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase.from("cloud_accounts").select("*", { count: "exact", head: true }),
        safeRpc("costs_aggregates"),
        supabase.from("recommendations").select("*", { count: "exact", head: true }),
      ]);
      const resources = r1.value?.count ?? 0;
      const accounts = r2.value?.count ?? 0;
      const daily = r3.value?.daily ?? 0;
      const recs = r4.value?.count ?? 0;
      setStats({ resources, accounts, daily, recs });

      // Preflight a mock call (non-blocking, ignore result)
      getCloudData("aws", "inventory").catch(() => {});
    }
    load();
  }, []);

  const hasSetup = stats.accounts > 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card-grid">
        <StatCard label="Linked Accounts" value={stats.accounts} />
        <StatCard label="Discovered Resources" value={stats.resources} />
        <StatCard label="Daily Spend" value={`$${Number(stats.daily).toFixed(2)}`} />
        <StatCard label="Open Recommendations" value={stats.recs} />
      </div>

      {!hasSetup && (
        <EmptyState
          title="Connect your first cloud account"
          description="Link AWS or Azure to begin discovering resources and analyzing costs."
          ctaLabel="Connect account"
          onCta={() => onGoTo?.("settings")}
        />
      )}
    </div>
  );
}
