import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up" }) {
  /** Small stat card with delta indicator.
   * Requirement: On Overview page, cards must be violet with white text.
   * We keep existing layout (grid/spacing) by preserving "card" class and
   * layering inline styles to override background and text color.
   */
  const violetStyles = {
    background: "#7C3AED", // violet
    color: "#FFFFFF",       // white text inside the card
    borderColor: "transparent",
  };

  // Delta color contrast on dark background: keep success/error tint visible.
  const deltaColor =
    deltaType === "down" ? { color: "#FEE2E2" } : { color: "#D1FAE5" };

  return (
    <div className="card" style={violetStyles}>
      <div className="label" style={{ color: "#EDE9FE" /* soft white */ }}>{label}</div>
      <div className="value" style={{ color: "#FFFFFF" }}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={deltaColor}>
          {deltaLabel}
        </div>
      )}
    </div>
  );
}
