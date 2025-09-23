import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./theme.css";
import "./index.css";
import Sidebar from "./components/ui/Sidebar";
import Topbar from "./components/ui/Topbar";
import Overview from "./features/overview/Overview";
import Inventory from "./features/inventory/Inventory";
import Costs from "./features/costs/Costs";
import Recommendations from "./features/recommendations/Recommendations";
import Automation from "./features/automation/Automation";
import Activity from "./features/activity/Activity";
import CloudConnections from "./features/settings/CloudConnections";
import { AuthProvider } from "./context/AuthContext";
import AuthGate from "./features/auth/AuthGate";
import Login from "./features/auth/Login";
import Profile from "./features/profile/Profile";
import { ToastProvider } from "./components/ui/Toast";

// PUBLIC_INTERFACE
function DashboardShell() {
  /** Main app shell guarded by auth, with sidebar + topbar and tabbed content. */
  const [search, setSearch] = useState("");

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Topbar onSearch={setSearch} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/inventory" element={<Inventory search={search} />} />
            <Route path="/costs" element={<Costs />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<CloudConnections />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Wraps the dashboard in AuthProvider and enforces authentication with an AuthGate. */
  const LoginFallback = (
    <div style={{ padding: 20 }}>
      <Login onSuccess={() => { /* AuthGate will re-render once session exists */ }} />
    </div>
  );
  
  return (
    <Router basename={process.env.PUBLIC_URL || '/'}>
      <AuthProvider>
        <AuthGate requireAuth={true} fallback={LoginFallback}>
          <ToastProvider>
            <DashboardShell />
          </ToastProvider>
        </AuthGate>
      </AuthProvider>
    </Router>
  );
}

export default App;
