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
  // Optional right-side image (string URL). If provided, we render flex with space-between.
  rightImageSrc,
  rightImageAlt = "",
  children,
}) {
  /** Minimalist curved banner with soft shadow, curved edges. */
  const alignStyles =
    align === "center"
      ? { alignItems: "center", textAlign: "center" }
      : { alignItems: "flex-start", textAlign: "left" };

  const withImage = Boolean(rightImageSrc);

  return (
    <section
      aria-label="Page banner"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16, // curved edges
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        padding: 16,
      }}
    >
      {/* subtle decorative shape (ensure it doesn't reduce contrast) */}
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
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: withImage ? "space-between" : "flex-start",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "8px 8px",
            display: "flex",
            gap: 10,
            flexDirection: "column",
            ...alignStyles,
            color: "var(--color-text)", // Pure White text color
            minWidth: 0,
          }}
        >
          {/* Title at the very top */}
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.25,
              fontWeight: 800,
              color: "var(--color-text)", // text on light surface
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
                color: "var(--muted, #374151)",
                maxWidth: 820,
              }}
            >
              {subtitle}
            </p>
          )}

          {children && (
            <div style={{ marginTop: 4, color: "var(--color-text)" }}>
              {children}
            </div>
          )}
        </div>

        {withImage && (
          <div
            aria-hidden="true"
            style={{
              position: "relative",
              flex: "0 0 auto",
              maxWidth: "40%",
              display: "grid",
              placeItems: "center",
            }}
          >
            <img
              src={rightImageSrc}
              alt={rightImageAlt}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: 420,
                objectFit: "contain",
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.08))",
                borderRadius: 8,
              }}
            />
          </div>
        )}
      </div>

      {/* Responsive rules: stack and scale image using inline <style> for component-scoped behavior */}
      <style>{`
        @media (max-width: 900px) {
          [aria-label="Page banner"] > div {
            flex-direction: column;
            align-items: flex-start;
          }
          [aria-label="Page banner"] img {
            max-width: 320px !important;
          }
        }
        @media (max-width: 520px) {
          [aria-label="Page banner"] h1 {
            font-size: 20px !important;
          }
          [aria-label="Page banner"] p {
            font-size: 13px !important;
          }
          [aria-label="Page banner"] img {
            max-width: 260px !important;
          }
        }
      `}</style>
    </section>
  );
}
