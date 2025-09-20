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
import { useAuth } from "./context/AuthContext";
import SignIn from "./components/ui/SignIn";

// PUBLIC_INTERFACE
function App() {
  /** Main app using sidebar + topbar layout with tabbed content panels. */
  const [route, setRoute] = useState("overview");
  const [search, setSearch] = useState("");
  const { user, loading } = useAuth();

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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="badge">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="layout">
      <Sidebar current={route} onNavigate={setRoute} />
      <div className="main">
        <Topbar onSearch={setSearch} />
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
