import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up", onClick }) {
  /** 
   * Rectangular stat card with delta indicator.
   * - Acts as a button when onClick is provided (keyboard accessible).
   * - Minimalist violet styling preserved.
   */
  const baseStyles = {
    minHeight: 100,
    padding: "16px 20px",
    borderRadius: 16,
    background: "#7C3AED",
    color: "#FFFFFF",
    border: "1px solid transparent",
    boxShadow: "0 8px 18px rgba(124, 58, 237, 0.22)",
    display: "grid",
    alignContent: "center",
    alignItems: "center",
    justifyItems: "start",
    gap: 6,
    transition: "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease",
  };

  const interactiveStyles = onClick
    ? {
        cursor: "pointer",
        outline: "none",
      }
    : {};

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const deltaColor =
    deltaType === "down" ? { color: "#FEE2E2" } : { color: "#D1FAE5" };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className="card"
      style={{ ...baseStyles, ...interactiveStyles }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-pressed={undefined}
      aria-label={onClick ? `${label}: ${typeof value === "string" ? value : String(value)}` : undefined}
    >
      <div className="label" style={{ color: "#EDE9FE", fontSize: 14 }}>{label}</div>
      <div className="value" style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 800 }}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={{ ...deltaColor, fontSize: 12 }}>
          {deltaLabel}
        </div>
      )}
    </Component>
  );
}
