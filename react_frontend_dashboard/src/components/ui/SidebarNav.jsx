import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,        // Dashboard
  FiLayers,      // Inventory
  FiServer,      // Resource Ops
  FiDollarSign,  // Cost & Billing
  FiBarChart2,   // AI Recommendations
  FiZap,         // Automation Rules
  FiShield,      // Security
  FiPieChart,    // Reports & Analytics
} from "react-icons/fi";

/**
 * PUBLIC_INTERFACE
 */
export default function SidebarNav() {
  /**
   * Minimalist Sidebar navigation for the Cross-Cloud Manager.
   * Only includes the items requested in this order with clear labels.
   */
  const { pathname } = useLocation();

  const navItems = [
    { to: "/overview", label: "Dashboard", Icon: FiGrid },
    { to: "/inventory", label: "Inventory", Icon: FiLayers },
    { to: "/resource-ops", label: "Resource Ops", Icon: FiServer },
    { to: "/costs", label: "Cost & Billing", Icon: FiDollarSign },
    { to: "/recommendations", label: "AI Recommendations", Icon: FiBarChart2 },
    { to: "/automation", label: "Automation Rules", Icon: FiZap },
    { to: "/security", label: "Security", Icon: FiShield },
    { to: "/reports-analytics", label: "Reports & Analytics", Icon: FiPieChart },
  ];

  const isActive = (to) => pathname === to;

  return (
    <aside className="sidebarNav" aria-label="Sidebar Navigation">
      <Link to="/overview" className="sidebarNav__brand" aria-label="Go to dashboard">
        <div className="sidebarNav__brandMark" aria-hidden="true">
          <span className="sidebarNav__brandLetter">C</span>
        </div>
        <div className="sidebarNav__brandName">Cross-Cloud Manager</div>
      </Link>

      <nav className="sidebarNav__groups" role="navigation">
        <div className="sidebarNav__group">
          <div className="sidebarNav__groupItems">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} active={isActive(item.to)} />
            ))}
          </div>
        </div>
      </nav>

      <div className="sidebarNav__accent" aria-hidden="true" />
    </aside>
  );
}

/**
 * PUBLIC_INTERFACE
 */
export function NavItem({ to, label, Icon, active }) {
  /** Single minimalist navigation row */
  return (
    <Link
      to={to}
      className={`sidebarNav__item${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="sidebarNav__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="sidebarNav__label">{label}</span>
    </Link>
  );
}
