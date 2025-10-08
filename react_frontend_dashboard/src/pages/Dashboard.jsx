import React, { useState } from "react";
import styles from "./Dashboard.module.css";
// Single source for the banner image
import dashboardBanner from "../assets/dashboard/dashboard-banner.png";

/**
 * PUBLIC_INTERFACE
 * Dashboard page component showing overview banner and summary cards
 */
export default function Dashboard() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={styles.pageWrap}>
      {/* Full-width banner image with fallback */}
      <section className={styles.imageBanner} aria-label="Dashboard banner">
        {!imageError ? (
          <img
            src={dashboardBanner}
            alt="Cloud resource management dashboard banner"
            className={styles.imageBannerImg}
            loading="eager"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.bannerFallback}>
            <h1>Welcome to Your Cloud Dashboard</h1>
            <p>Manage and optimize your cloud resources from one place</p>
          </div>
        )}
      </section>

      {/* Body content */}
      <div className={styles.body}>
        <div className={styles.card}>Your daily summary appears here.</div>
        <div className={styles.card}>Recent activity and insights.</div>
      </div>
    </div>
  );
}
