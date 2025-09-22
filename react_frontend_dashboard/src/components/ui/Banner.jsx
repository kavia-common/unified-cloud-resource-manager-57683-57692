import React from "react";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function Banner({
  // Title defaults to a friendly welcome (moved to top)
  title = "Welcome back!",
  // Optional subtitle; if not provided, we show the default product message
  subtitle = "Manage, monitor, and optimize your cloud with ease",
  align = "left",
  children,
}) {
  /** Minimalist curved banner with soft shadow, curved edges. */
  const alignStyles =
    align === "center"
      ? { alignItems: "center", textAlign: "center" }
      : { alignItems: "flex-start", textAlign: "left" };

  return (
    <section
      aria-label="Page banner"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16, // curved edges
        // Soft violet gradient that complements Pure White theme
        background: "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)", // violet-50 to violet-100
        border: "1px solid var(--border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      {/* subtle decorative shape */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -40,
          top: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            // faint violet blur for minimalist accent
            "radial-gradient(closest-side, rgba(124,58,237,0.10), rgba(124,58,237,0.00))",
          filter: "blur(0.2px)",
        }}
      />
      <div
        style={{
          padding: "20px 20px",
          display: "flex",
          gap: 10,
          flexDirection: "column",
          ...alignStyles,
        }}
      >
        {/* Title at the very top */}
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.25,
            fontWeight: 800,
            // Deep violet for strong contrast on soft violet background
            color: "#4C1D95", // violet-900
            letterSpacing: 0.2,
          }}
        >
          {title}
        </h1>

        {/* Subtitle directly under title */}
        {subtitle && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              // Muted violet for secondary text
              color: "#6D28D9", // violet-700
              maxWidth: 820,
            }}
          >
            {subtitle}
          </p>
        )}

        {children && <div style={{ marginTop: 4 }}>{children}</div>}
      </div>
    </section>
  );
}
