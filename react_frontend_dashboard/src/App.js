import React, { useState } from "react";
import "./theme.css";
import Sidebar from "./components/ui/Sidebar";
import Topbar from "./components/ui/Topbar";
import Overview from "./features/overview/Overview";
import Inventory from "./features/inventory/Inventory";
import Costs from "./features/costs/Costs";
import Recommendations from "./features/recommendations/Recommendations";
import Automation from "./features/automation/Automation";
import Activity from "./features/activity/Activity";
import CloudConnections from "./features/settings/CloudConnections";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthGate from "./features/auth/AuthGate";
import Login from "./features/auth/Login";
import Profile from "./features/profile/Profile";

// PUBLIC_INTERFACE
function DashboardShell() {
  /** Main app shell guarded by auth, with sidebar + topbar and tabbed content. */
  const [route, setRoute] = useState("overview");
  const [search, setSearch] = useState("");

  const renderContent = () => {
    switch (route) {
      case "overview":
        return <Overview onGoTo={setRoute} />;
      case "inventory":
        return <Inventory search={search} />;
      case "costs":
        return <Costs />;
      case "recommendations":
        return <Recommendations />;
      case "automation":
        return <Automation />;
      case "activity":
        return <Activity />;
      case "settings":
        return <CloudConnections />;
      case "profile":
        return <Profile />;
      default:
        return <Overview onGoTo={setRoute} />;
    }
  };

  return (
    <div className="layout">
      <Sidebar current={route} onNavigate={setRoute} />
      <div className="main">
        <Topbar onSearch={setSearch} onNavigate={setRoute} />
        <main className="content">{renderContent()}</main>
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
    <AuthProvider>
      <AuthBoundary fallback={LoginFallback}>
        <DashboardShell />
      </AuthBoundary>
    </AuthProvider>
  );
}

function AuthBoundary({ fallback, children }) {
  const { user } = useAuth();
  return (
    <AuthGate requireAuth={true} fallback={fallback}>
      {children}
    </AuthGate>
  );
}

export default App;
