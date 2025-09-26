import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,       // Dashboard
  FiCreditCard, // Payment
  FiUsers,      // Customers
  FiMessageCircle, // Message
  FiBriefcase,  // Project
  FiFileText,   // Invoice
  FiBarChart2,  // Analytics
  FiZap,        // Automation
  FiSettings,   // Settings
  FiHelpCircle, // Help
  FiLogOut,     // Logout
} from "react-icons/fi";

/**
 * PUBLIC_INTERFACE
 */
export default function SidebarNav() {
  /**
   * SidebarNav renders the left sidebar navigation using the extracted design notes:
   * - 256px width, 16px inner padding, icon + text rows (44px height)
   * - Active/hover states with soft brand tint
   * - Optional "NEW" badge on Automation
   */
  const { pathname } = useLocation();

  // Define groups based on the design document
  const primary = [
    { to: "/overview", label: "Dashboard", Icon: FiGrid },
    { to: "/costs", label: "Payment", Icon: FiCreditCard },
    { to: "/inventory", label: "Customers", Icon: FiUsers },
    { to: "/activity", label: "Message", Icon: FiMessageCircle },
  ];

  const secondary = [
    { to: "/overview?tab=projects", label: "Project", Icon: FiBriefcase },
    { to: "/overview?tab=invoice", label: "Invoice", Icon: FiFileText },
    { to: "/recommendations", label: "Analytics", Icon: FiBarChart2 },
    { to: "/automation", label: "Automation", Icon: FiZap, badge: "NEW" },
  ];

  const support = [
    { to: "/settings", label: "Settings", Icon: FiSettings },
    { to: "/help", label: "Help", Icon: FiHelpCircle },
    { to: "/logout", label: "Logout", Icon: FiLogOut },
  ];

  // Helper to compute active route (exact match or startsWith for query tabs)
  const isActive = (to) => {
    // Treat querystring targets as active if pathname base matches
    const base = to.split("?")[0];
    return pathname === base;
  };

  return (
    <aside className="sidebarNav" aria-label="Sidebar Navigation">
      <a href="/overview" className="sidebarNav__brand" aria-label="Go to dashboard">
        <div className="sidebarNav__brandMark" aria-hidden="true">
          <span className="sidebarNav__brandLetter">C</span>
        </div>
        <div className="sidebarNav__brandName">Cross-Cloud Manager</div>
      </a>

      <nav className="sidebarNav__groups" role="navigation">
        <NavGroup>
          {primary.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </NavGroup>

        <NavGroup>
          {secondary.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </NavGroup>

        <NavGroup>
          {support.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </NavGroup>
      </nav>

      {/* Optional accent footer stripe as a brand flourish */}
      <div className="sidebarNav__accent" aria-hidden="true" />
    </aside>
  );
}

/**
 * PUBLIC_INTERFACE
 */
export function NavGroup({ children, heading }) {
  /** Renders a vertical group of navigation items with spacing and optional label. */
  return (
    <div className="sidebarNav__group">
      {heading && <div className="sidebarNav__groupLabel">{heading}</div>}
      <div className="sidebarNav__groupItems">{children}</div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 */
export function NavItem({ to, label, Icon, active, badge }) {
  /**
   * Single navigation row (44px height):
   * - Grid: icon | label | optional badge
   * - Hover/Active tints and optional left accent bar when active
   */
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
      {badge ? <span className="sidebarNav__badge">{badge}</span> : null}
    </Link>
  );
}
