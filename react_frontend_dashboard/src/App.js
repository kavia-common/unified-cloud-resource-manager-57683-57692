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
import Operations from "./features/operations/Operations";

const ReportsAnalytics = () => (
  <div className="panel">
    <div className="panel-header">
      <div className="panel-title">Reports & Analytics</div>
    </div>
    <div className="panel-body">
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        Generate and view consolidated cross-cloud reports. (Coming soon)
      </div>
    </div>
  </div>
);

/**
 * PUBLIC_INTERFACE
 * App shell without authentication screens.
 * Removes login/sign-in routes and renders the dashboard directly.
 *
 * Returns:
 * - A BrowserRouter-wrapped application shell containing:
 *    - SidebarNav: left navigation
 *    - Topbar: top header
 *    - Routes: overview, inventory, operations, costs, recommendations, automation, reports, plus legacy routes
 * Notes:
 * - Providers (e.g., ToastProvider, AuthContext) are expected to be applied at src/index.js.
 * - Authentication screens are intentionally omitted to meet the current product requirements.
 */
function App() {
  /**
   * This is the public root shell for the dashboard UI.
   */
  return (
    <BrowserRouter>
      {/* App shell layout: [SidebarNav | Main] */}
      <div className="app-shell" role="application" aria-label="Cross-Cloud Manager App Shell">
        <SidebarNav />
        <main className="main" role="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
              {/* Legacy/unrelated routes retained but not linked in nav */}
              <Route path="/activity" element={<Activity />} />
              <Route path="/settings" element={<CloudConnections />} />
              <Route path="/profile" element={<Profile />} />
              {/* Remove or redirect any legacy auth paths */}
              <Route path="/login" element={<Navigate to="/overview" replace />} />
              <Route path="/signin" element={<Navigate to="/overview" replace />} />
              <Route path="/help" element={<div style={{padding:20}}>Help coming soon.</div>} />
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
