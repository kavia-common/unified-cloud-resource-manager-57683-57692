import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,          // Overview
  FiLayers,        // Inventory
  FiDollarSign,    // Costs
  FiZap,           // Recommendations
  FiAperture,      // Automation
  FiActivity,      // Activity
  FiSettings,      // Settings/Connect
  FiUser,          // Profile
} from "react-icons/fi";

/**
 * PUBLIC_INTERFACE
 */
export default function Sidebar() {
  /** Pure White minimalist sidebar navigation with icons for clarity. */
  const items = [
    { to: "/overview", label: "Overview", Icon: FiHome },
    { to: "/inventory", label: "Inventory", Icon: FiLayers },
    { to: "/costs", label: "Costs", Icon: FiDollarSign },
    { to: "/recommendations", label: "Recommendations", Icon: FiZap },
    { to: "/automation", label: "Automation", Icon: FiAperture },
    { to: "/activity", label: "Activity", Icon: FiActivity },
    { to: "/settings", label: "Settings", Icon: FiSettings },
    { to: "/profile", label: "Profile", Icon: FiUser },
  ];
  const { pathname } = useLocation();

  return (
    <aside className="sidebar" aria-label="Sidebar Navigation">
      <div className="brand">
        <span className="dot" aria-hidden="true" />
        <div className="title">Cross-Cloud Manager</div>
      </div>
      <div className="section-title">Navigate</div>
      <nav className="nav">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`nav-btn ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              style={{ textDecoration: "none" }}
            >
              <Icon aria-hidden="true" size={18} style={{ color: "var(--primary)" }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
