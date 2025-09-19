import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up" }) {
  /** Small stat card with delta indicator. */
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {deltaLabel && <div className={`delta ${deltaType}`}>{deltaLabel}</div>}
    </div>
  );
}
