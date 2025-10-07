import React from "react";

/**
 * PUBLIC_INTERFACE
 * ActionsBar renders a right-aligned toolbar with primary dashboard actions.
 * Buttons:
 * - Add Account: Solid primary style (visual emphasis)
 * - Run Optimization: Subtle outline secondary style
 *
 * Accessibility:
 * - aria-labels provided
 * - focus styles using outline and box-shadow
 *
 * Testing:
 * - data-testid attributes on container and buttons
 *
 * Styling:
 * - Minimalist Pure White theme using inline styles aligned with CSS variables from theme.css
 * - Primary text color #374151, subtle border #E5E7EB, hover bg #F3F4F6, rounded-md
 */
export default function ActionsBar(): JSX.Element {
  // Handlers are currently placeholders for future Supabase Edge Functions integration.
  const handleAddAccount = () => {
    // TODO: Wire to open AddCloudAccountModal or navigate to Cloud Connections.
    // TODO: Integrate with Supabase when available.
    // eslint-disable-next-line no-console
    console.log("[ActionsBar] Add Account clicked");
  };

  const handleRunOptimization = () => {
    // TODO: Wire to trigger optimization Edge Function and show progress/toast.
    // TODO: Integrate with Supabase when available.
    // eslint-disable-next-line no-console
    console.log("[ActionsBar] Run Optimization clicked");
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const baseBtn: React.CSSProperties = {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1,
    padding: "10px 14px",
    borderRadius: 8, // rounded-md feel
    border: "1px solid #E5E7EB",
    cursor: "pointer",
    background: "#FFFFFF",
    color: "#374151",
    transition: "background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .05s ease",
    outline: "none",
  };

  const primaryBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#374151",
    color: "#FFFFFF",
    borderColor: "#D1D5DB",
  };

  const secondaryBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#FFFFFF",
    color: "#374151",
    borderColor: "#E5E7EB",
  };

  const hoverStyle = (isPrimary = false): React.CSSProperties => ({
    background: isPrimary ? "#1F2937" : "#F3F4F6",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  });

  const focusRing: React.CSSProperties = {
    boxShadow: "0 0 0 3px rgba(59,130,246,0.25)",
    borderColor: "#93C5FD",
  };

  return (
    <div
      style={containerStyle}
      aria-label="Dashboard primary actions"
      data-testid="actions-bar"
    >
      {/* Intentionally removed 'Add Account' button from this actions bar to avoid duplication.
          Keep only 'Run Optimization' here; the remaining 'Add Account' below the recommendations
          continues to open AddAccountMinimalModal. */}
      <button
        type="button"
        aria-label="Run Optimization"
        data-testid="btn-run-optimization"
        onClick={handleRunOptimization}
        style={secondaryBtn}
        onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { ...secondaryBtn, ...hoverStyle(false) })}
        onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, secondaryBtn)}
        onFocus={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { ...secondaryBtn, ...focusRing })}
        onBlur={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, secondaryBtn)}
      >
        Run Optimization
      </button>
    </div>
  );
}
