import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up", onClick }) {
  /**
   * Rectangular stat card with delta indicator.
   * - Acts as a button when onClick is provided (keyboard accessible).
   * - Follows global Pure White theme styles via .card.
   * - Hover pop handled in theme.css for consistency.
   */
  const containerBase = {
    minHeight: 100,
    padding: "16px 20px",
    display: "grid",
    alignContent: "center",
    alignItems: "center",
    justifyItems: "start",
    gap: 6,
  };

  const interactiveStyles = onClick
    ? { cursor: "pointer", outline: "none" }
    : {};

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className="card"
      style={{ ...containerBase, ...interactiveStyles }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-pressed={undefined}
      aria-label={
        onClick ? `${label}: ${typeof value === "string" ? value : String(value)}` : undefined
      }
    >
      <div className="label" style={{ fontSize: 14 }}>{label}</div>
      <div className="value" style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={{ fontSize: 12 }}>
          {deltaLabel}
        </div>
      )}
    </Component>
  );
}
