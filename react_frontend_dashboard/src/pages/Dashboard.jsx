import React from "react";
import styles from "./Dashboard.module.css";
// Use cache-busted filename to avoid stale cache issues in preview environments
import newBanner from "../assets/dashboard/new-dashboard-banner.v3.png";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard page showing a minimalist full-bleed banner image.
   * - Replaces the previous welcome banner text/CTA with a pure image banner.
   * - Responsive: full-width container, constrained max-height with cover behavior.
   * - Pure White theme: clean spacing, subtle border, no clutter.
   */
  return (
    <div className={styles.pageWrap}>
      {/* Full-width banner image replacing the previous welcome banner */}
      <section className={styles.imageBanner} aria-label="Dashboard banner image">
        <img
          src={newBanner}
          alt="Unified cloud dashboard banner"
          className={styles.imageBannerImg}
          loading="eager"
        />
      </section>

      {/* Body content below remains intact */}
      <div className={styles.body}>
        <div className={styles.card}>Your daily summary appears here.</div>
        <div className={styles.card}>Recent activity and insights.</div>
      </div>
    </div>
  );
}
