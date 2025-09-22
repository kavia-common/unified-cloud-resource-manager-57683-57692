import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up" }) {
  /** 
   * Rectangular stat card with delta indicator.
   * Changes:
   * - Remove square aspect ratio; use a modest fixed minHeight to appear wider than tall.
   * - Maintain violet background, white text, and curved edges.
   * - Keep responsive behavior via grid container from theme.css.
   */
  const containerStyles = {
    // Rectangle: wider than tall comes from grid width vs. height here
    minHeight: 100, // rectangular profile
    padding: "16px 20px",
    borderRadius: 16,
    background: "#7C3AED", // violet
    color: "#FFFFFF",
    border: "1px solid transparent",
    boxShadow: "0 8px 18px rgba(124, 58, 237, 0.22)", // subtle violet glow
    display: "grid",
    alignContent: "center",
    alignItems: "center",
    justifyItems: "start",
    gap: 6,
  };

  // Delta color contrast on dark background
  const deltaColor =
    deltaType === "down" ? { color: "#FEE2E2" } : { color: "#D1FAE5" };

  return (
    <div className="card" style={containerStyles}>
      <div className="label" style={{ color: "#EDE9FE", fontSize: 12 }}>{label}</div>
      <div className="value" style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 800 }}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={{ ...deltaColor, fontSize: 12 }}>
          {deltaLabel}
        </div>
      )}
    </div>
  );
}
