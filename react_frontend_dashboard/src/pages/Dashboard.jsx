import React from "react";
import styles from "./Dashboard.module.css";
import bannerImg from "../assets/dashboard/banner-image.png";

/**
 * PUBLIC_INTERFACE
 */
// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard page with a minimalist Pure White banner.
   * Left side: title/subtitle content
   * Right side: decorative/product image pinned to the right
   * Responsive: on small screens the image scales and drops below content to avoid overlap.
   */
  return (
    <div className={styles.pageWrap}>
      <section className={styles.banner} aria-label="Dashboard banner">
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>Welcome back!</h1>
          <p className={styles.bannerSubtitle}>
            Manage, monitor, and optimize your cloud with ease
          </p>
          <div className={styles.bannerActions}>
            <button className="btn primary">Quick Start</button>
            <button className="btn">Learn More</button>
          </div>
        </div>

        {/* Image pinned to the right. Hidden from screen readers as decorative. */}
        <div className={styles.bannerImageWrap} aria-hidden="true">
          <img
            src={bannerImg}
            alt=""
            className={styles.bannerImage}
            loading="eager"
          />
        </div>
      </section>

      {/* Placeholder body content to demonstrate layout continuity */}
      <div className={styles.body}>
        <div className={styles.card}>Your daily summary appears here.</div>
        <div className={styles.card}>Recent activity and insights.</div>
      </div>
    </div>
  );
}
