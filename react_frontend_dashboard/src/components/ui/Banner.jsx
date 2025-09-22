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
        // Set solid violet background per requirement
        background: "#7C3AED", // violet (approx Tailwind violet-600)
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      }}
    >
      {/* subtle decorative shape (keep but ensure it doesn't reduce contrast) */}
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
            "radial-gradient(closest-side, rgba(255,255,255,0.18), rgba(255,255,255,0.00))",
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
          color: "#FFFFFF", // default text color inside banner -> white
        }}
      >
        {/* Title at the very top */}
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.25,
            fontWeight: 800,
            color: "#FFFFFF", // white text on violet background
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
              color: "rgba(255,255,255,0.92)", // slightly softened white for hierarchy
              maxWidth: 820,
            }}
          >
            {subtitle}
          </p>
        )}

        {children && (
          <div style={{ marginTop: 4, color: "#FFFFFF" }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
