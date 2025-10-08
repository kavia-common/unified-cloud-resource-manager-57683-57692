import React from "react";
import styles from "./Dashboard.module.css";
// Single source for the banner image
import newBanner from "../assets/dashboard/new-dashboard-banner.v3.png";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard page showing a minimalist full-bleed banner image.
   * - Uses a single banner image instance
   * - No error state toggles or background fallbacks
   * - Responsive: full-width container, constrained max-height with cover behavior
   * - Pure White theme: clean spacing, subtle border, no clutter
   */
  return (
    <div className={styles.pageWrap}>
      {/* Full-width banner image */}
      <section className={styles.imageBanner} aria-label="Dashboard banner image">
        <img
          src={newBanner}
          alt="Unified cloud dashboard banner"
          className={styles.imageBannerImg}
          loading="eager"
          // Remove any onError handlers to prevent retry loops
          // If image fails to load, it will show alt text without retrying
        />
      </section>

      {/* Body content */}
      <div className={styles.body}>
        <div className={styles.card}>Your daily summary appears here.</div>
        <div className={styles.card}>Recent activity and insights.</div>
      </div>
    </div>
  );
}
