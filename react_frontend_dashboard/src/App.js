import React, { useState } from "react";
import "./theme.css";
import { AuthProvider } from "./context/AuthContext";
import AuthGate from "./features/auth/AuthGate";
import Sidebar from "./components/ui/Sidebar";
import Topbar from "./components/ui/Topbar";
import Overview from "./features/overview/Overview";
import Inventory from "./features/inventory/Inventory";
import Costs from "./features/costs/Costs";
import Recommendations from "./features/recommendations/Recommendations";
import Automation from "./features/automation/Automation";
import Activity from "./features/activity/Activity";
import CloudConnections from "./features/settings/CloudConnections";

// PUBLIC_INTERFACE
function App() {
  /** Main app using sidebar + topbar layout with tabbed content panels. */
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
      default:
        return <Overview onGoTo={setRoute} />;
    }
  };

  return (
    <AuthProvider>
      <AuthGate>
        <div className="layout">
          <Sidebar current={route} onNavigate={setRoute} />
          <div className="main">
            <Topbar onSearch={setSearch} />
            <main className="content">{renderContent()}</main>
          </div>
        </div>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
