import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ label, value, deltaLabel, deltaType = "up", onClick, variant = "violet", valueStyleOverride }) {
  /**
   * Rectangular stat card with delta indicator.
   * - Acts as a button when onClick is provided (keyboard accessible).
   * - Follows global Pure White theme styles via .card.
   * - Hover pop handled in theme.css for consistency.
   * - variant: allows themed backgrounds; default to 'violet' per design request.
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

  const interactiveStyles = onClick ? { cursor: "pointer", outline: "none" } : {};

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const Component = onClick ? "button" : "div";
  const classes = ["card"];
  if (variant === "violet") classes.push("card-violet");

  // Inline color hints to ensure accessibility on colored backgrounds
  const labelStyle = { fontSize: 14, color: "var(--card-oncolor)" };
  const valueStyle = { fontSize: 26, fontWeight: 800, color: "var(--card-oncolor-strong)", ...(valueStyleOverride || {}) };
  const deltaCommon = { fontSize: 12 };

  return (
    <Component
      className={classes.join(" ")}
      style={{ ...containerBase, ...interactiveStyles }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-pressed={undefined}
      aria-label={
        onClick ? `${label}: ${typeof value === "string" ? value : String(value)}` : undefined
      }
    >
      <div className="label" style={labelStyle}>{label}</div>
      <div className="value" style={valueStyle}>{value}</div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={deltaCommon}>
          {deltaLabel}
        </div>
      )}
    </Component>
  );
}
