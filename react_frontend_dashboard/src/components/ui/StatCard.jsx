import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({
  label,
  value,
  deltaLabel,
  deltaType = "up",
  onClick,
  // Default to violet to satisfy new dashboard card color requirement
  variant = "violet",
  valueStyleOverride,
}) {
  /**
   * Minimalist stat card with curved edges and subtle elevation.
   * - Uses Pure White theme tokens for surface, borders, and text.
   * - Behaves as a button if onClick provided (keyboard accessible).
   * - Responsive-friendly: width is governed by parent layout (e.g., .card-grid).
   */
  const baseCardStyles = {
    minHeight: 100,
    padding: "16px 18px",
    display: "grid",
    alignContent: "center",
    alignItems: "center",
    justifyItems: "start",
    gap: 6,
    borderRadius: 12,
    background: "var(--card-bg, #FFFFFF)",
    border: "1px solid var(--card-border, #E5E7EB)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.06)",
    transition: "box-shadow 120ms ease, transform 60ms ease, border-color 120ms ease, background 120ms ease",
    textAlign: "left",
  };

  const interactiveStyles = onClick
    ? {
        cursor: "pointer",
      }
    : {};

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  // Variant theming (keep subtle; default neutral)
  let cardVars = {};
  if (variant === "neutral") {
    cardVars = {
      ["--card-bg"]: "#FFFFFF",
      ["--card-border"]: "#E5E7EB",
      ["--card-oncolor"]: "#6B7280",
      ["--card-oncolor-strong"]: "#111827",
    };
  } else if (variant === "violet") {
    // Accessible violet on light surface: background and border are soft,
    // text uses deep violet for strong contrast.
    cardVars = {
      ["--card-bg"]: "#EDE9FE",            // Violet-100 (soft background)
      ["--card-border"]: "#DDD6FE",        // Violet-200 (subtle border)
      ["--card-oncolor"]: "#5B21B6",       // Violet-800 for labels
      ["--card-oncolor-strong"]: "#3B0764",// Violet-950 for primary value
    };
  }

  const Component = onClick ? "button" : "div";

  const labelStyle = {
    fontSize: 12,
    letterSpacing: 0.2,
    fontWeight: 700,
    color: "var(--card-oncolor, #6B7280)",
    textTransform: "uppercase",
  };
  const valueStyle = {
    fontSize: 26,
    fontWeight: 800,
    color: "var(--card-oncolor-strong, #111827)",
    ...(valueStyleOverride || {}),
  };
  const deltaStyle = {
    fontSize: 12,
    color: deltaType === "down" ? "#EF4444" : "#10B981",
    fontWeight: 600,
  };

  return (
    <Component
      className="stat-card"
      style={{ ...baseCardStyles, ...interactiveStyles, ...cardVars }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...(onClick ? { role: "button", tabIndex: 0, "aria-label": `${label}: ${value}` } : {})}
    >
      <div className="label" style={labelStyle}>
        {label}
      </div>
      <div className="value" style={valueStyle}>
        {value}
      </div>
      {deltaLabel && (
        <div className={`delta ${deltaType}`} style={deltaStyle}>
          {deltaLabel}
        </div>
      )}
    </Component>
  );
}
