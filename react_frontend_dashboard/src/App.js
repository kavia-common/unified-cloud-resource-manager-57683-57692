import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SidebarNav from "./components/ui/SidebarNav";
import "./components/ui/SidebarNav.css";
import Topbar from "./components/ui/Topbar";
import Overview from "./features/overview/Overview";
import Inventory from "./features/inventory/Inventory";
import Costs from "./features/costs/Costs";
import Recommendations from "./features/recommendations/Recommendations";
import Automation from "./features/automation/Automation";
import Activity from "./features/activity/Activity";
import CloudConnections from "./features/settings/CloudConnections";
import Profile from "./features/profile/Profile";
import "./App.css";
import "./theme.css";
import Security from "./features/security/Security";
import ResourceOps from "./features/operations/ResourceOps";
import ReportsAnalytics from "./features/reports/ReportsAnalytics";
import ClickSpark from "./components/ui/ClickSpark";

/**
 * PUBLIC_INTERFACE
 * App shell without authentication screens.
 * Removes login/sign-in routes and renders the dashboard directly.
 *
 * Returns:
 * - A BrowserRouter-wrapped application shell containing:
 *    - SidebarNav: left navigation
 *    - Topbar: top header
 *    - Routes: overview, inventory, costs, recommendations, automation, security, reports, plus legacy routes
 * Notes:
 * - Providers (e.g., ToastProvider, AuthContext) are expected to be applied at src/index.js.
 * - Authentication screens are intentionally omitted to meet the current product requirements.
 */
function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Enable click sparks globally */}
      <ClickSpark />

      {/* App shell layout: [SidebarNav | Main] */}
      <div
        className="app-shell"
        role="application"
        aria-label="Cross-Cloud Manager App Shell"
      >
        <SidebarNav />
        <main className="main" role="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/security" element={<Security />} />
              <Route path="/resource-ops" element={<ResourceOps />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
              <Route path="/reports-analytics" element={<ReportsAnalytics />} />

              {/* Legacy/unrelated routes retained but not linked in nav */}
              <Route path="/activity" element={<Activity />} />
              <Route path="/settings" element={<CloudConnections />} />
              <Route path="/profile" element={<Profile />} />

              {/* Remove or redirect any legacy auth paths */}
              <Route path="/login" element={<Navigate to="/overview" replace />} />
              <Route path="/signin" element={<Navigate to="/overview" replace />} />
              <Route
                path="/help"
                element={<div style={{ padding: 20 }}>Help coming soon.</div>}
              />
              <Route path="/logout" element={<Navigate to="/overview" replace />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
