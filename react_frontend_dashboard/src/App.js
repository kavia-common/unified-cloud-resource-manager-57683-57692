import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/ui/Sidebar";
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

/**
 * App shell without authentication screens.
 * Removes login/sign-in routes and renders the dashboard directly.
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/settings" element={<CloudConnections />} />
              <Route path="/profile" element={<Profile />} />
              {/* Remove or redirect any legacy auth paths */}
              <Route path="/login" element={<Navigate to="/overview" replace />} />
              <Route path="/signin" element={<Navigate to="/overview" replace />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
