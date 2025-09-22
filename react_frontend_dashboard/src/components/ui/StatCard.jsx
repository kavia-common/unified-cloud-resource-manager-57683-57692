import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up" }) {
  /** 
   * Square stat card with delta indicator.
   * - Square: uses aspectRatio + minHeight fallback.
   * - Larger visual size.
   * - More curved edges (prominent rounded corners).
   * - Preserves violet background with white text.
   */
  const containerStyles = {
    // Ensure square shape
    aspectRatio: "1 / 1",
    minHeight: 140, // fallback for browsers without aspect-ratio support
    // Visual prominence
    padding: 20,
    borderRadius: 18, // more curved edges
    background: "#7C3AED", // violet
    color: "#FFFFFF",
    border: "1px solid transparent",
    boxShadow: "0 10px 22px rgba(124, 58, 237, 0.25)", // subtle violet glow
    display: "grid",
    alignContent: "center",
    alignItems: "center",
    justifyItems: "start",
    gap: 8,
  };

  // Delta color contrast on dark background
  const deltaColor =
    deltaType === "down" ? { color: "#FEE2E2" } : { color: "#D1FAE5" };

  return (
    <div className="card" style={containerStyles}>
      <div className="label" style={{ color: "#EDE9FE", fontSize: 13 }}>{label}</div>
      <div className="value" style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 800 }}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={{ ...deltaColor, fontSize: 13 }}>
          {deltaLabel}
        </div>
      )}
    </div>
  );
}
