import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { serviceApi, waitlistApi, reservationsApi } from "../services/api";
import { socket } from "../services/socket";

import FloorPlan from "../components/FloorPlan/FloorPlan";
import KitchenDisplay from "../components/KitchenDisplay/KitchenDisplay";
import WaitlistModule from "../components/WaitlistModule/WaitlistModule";
import ServiceAlerts from "../components/ServiceAlerts/ServiceAlerts";
import ReservationPipeline from "../components/ReservationPipeline/ReservationPipeline";
import Insights from "../components/Insights/Insights";

import "./DashboardPage.css";

const NAV = [
  { id: "floor", label: "Floor Plan", icon: "⊞", perm: "floor_view" },
  { id: "orders", label: "Kitchen Orders", icon: "🍳", perm: "kitchen_view" },
  { id: "alerts", label: "Service Alerts", icon: "🔔", perm: "service_alerts", badge: "alerts" },
  { id: "waitlist", label: "Waitlist & Queue", icon: "≡", perm: "waitlist_view", badge: "waitlist" },
  { id: "reservations", label: "Reservations", icon: "📋", perm: "reservations_view", badge: "reservations" },
  { id: "insights", label: "Insights", icon: "⊙", perm: "insights" },
  { id: "settings", label: "Settings", icon: "⚙", perm: "settings" },
];

function getDefaultTab(can) {
  const order = ["floor", "orders", "alerts", "waitlist", "reservations", "insights", "settings"];
  for (const id of order) {
    const nav = NAV.find((n) => n.id === id);
    if (nav && can(nav.perm)) return id;
  }
  return "floor";
}

export default function DashboardPage() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => getDefaultTab(can));
  const [badges, setBadges] = useState({ alerts: 0, waitlist: 0, reservations: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifBar, setNotifBar] = useState(null);

  useEffect(() => {
    loadBadges();

    socket.on("service:new", (req) => {
      setBadges((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      addActivity(`Table ${req.tableId} — ${req.type === "bill_request" ? "Bill Request" : "Waiter Call"}`);
      if (user?.role === "server") setActiveTab("alerts");
      setNotifBar(`🔔 ${req.tableName} is calling for ${req.type === "bill_request" ? "the bill" : "a waiter"}`);
      setTimeout(() => setNotifBar(null), 5000);
    });

    socket.on("waitlist:added", (entry) => {
      setBadges((prev) => ({ ...prev, waitlist: prev.waitlist + 1 }));
      addActivity(`Walk-in: ${entry.guestName} (${entry.partySize} pax) added to queue`);
    });

    socket.on("waitlist:removed", () => {
      setBadges((prev) => ({ ...prev, waitlist: Math.max(0, prev.waitlist - 1) }));
    });

    socket.on("reservation:new", (res) => {
      setBadges((prev) => ({ ...prev, reservations: prev.reservations + 1 }));
      addActivity(`New reservation lead: ${res.name} — ${res.service}`);
    });

    socket.on("table:statusChanged", (table) => {
      addActivity(`Table ${table.tableId} → ${table.status.replace("_", " ")}`);
    });

    socket.on("order:new", (order) => {
      addActivity(`New order from ${order.tableName} — ₹${order.total}`);
    });

    return () => {
      socket.off("service:new");
      socket.off("waitlist:added");
      socket.off("waitlist:removed");
      socket.off("reservation:new");
      socket.off("table:statusChanged");
      socket.off("order:new");
    };
  }, [user]);

  const loadBadges = async () => {
    try {
      const [alertsRes, waitlistRes, resRes] = await Promise.all([
        serviceApi.getAll(),
        waitlistApi.getAll(),
        reservationsApi.getStats(),
      ]);
      setBadges({
        alerts: alertsRes.data.filter((r) => r.status === "new").length,
        waitlist: waitlistRes.data.length,
        reservations: resRes.data.newLeads,
      });
    } catch (_) {}
  };

  const addActivity = (msg) => {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setRecentActivity((prev) => [`${time} — ${msg}`, ...prev].slice(0, 8));
  };

  const handleAlertAck = () => setBadges((prev) => ({ ...prev, alerts: Math.max(0, prev.alerts - 1) }));

  const tabContent = () => {
    switch (activeTab) {
      case "floor":       return <FloorPlan />;
      case "orders":      return <KitchenDisplay />;
      case "waitlist":    return <WaitlistModule />;
      case "alerts":      return <ServiceAlerts onAck={handleAlertAck} />;
      case "reservations":return <ReservationPipeline />;
      case "insights":    return <Insights />;
      case "settings":    return <SettingsTab />;
      default:            return null;
    }
  };

  return (
    <div className="dashboardOS">
      <div className="grainOverlayDash" />

      <AnimatePresence>
        {notifBar && (
          <motion.div
            className="notifBar"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            transition={{ duration: 0.3 }}
          >
            {notifBar}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="dashSidebar">
        <div className="sidebarBrand">
          <p className="sidebarBrandName">BASQUE</p>
          <p className="sidebarBrandSub">MANAGER OS</p>
        </div>

        <div className="sidebarDivider" />

        <nav className="sidebarNav">
          {NAV.map((item) => {
            if (!can(item.perm)) return null;
            const badgeCount = item.badge ? badges[item.badge] : 0;
            return (
              <button
                key={item.id}
                className={`sidebarNavItem ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="navIcon">{item.icon}</span>
                <span className="navLabel">{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`navBadge ${item.id === "alerts" ? "badgeRed" : ""}`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebarDivider" />

        {recentActivity.length > 0 && (
          <div className="recentActivity">
            <p className="activityTitle">RECENT ACTIVITY</p>
            {recentActivity.slice(0, 4).map((item, i) => (
              <p key={i} className="activityItem">{item}</p>
            ))}
          </div>
        )}

        <div className="sidebarDivider" />

        <div className="sidebarFooter">
          {can("audit_export") && (
            <button className="sidebarFooterBtn" onClick={() => window.open("http://localhost:5000/api/audit/export", "_blank")}>
              Export Audit Log
            </button>
          )}
          <div className="sidebarUser">
            <p className="sidebarUserName">{user?.name}</p>
            <p className="sidebarUserRole">{user?.role?.replace("_", " ").toUpperCase()}</p>
          </div>
          <button className="logoutBtn" onClick={() => { logout(); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashMain">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="dashContent"
        >
          {tabContent()}
        </motion.div>
      </main>
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  return (
    <div className="settingsTab">
      <div className="dashPanelHeader">
        <h2 className="dashPanelTitle">Settings</h2>
      </div>
      <div className="settingsGrid">
        <div className="settingsCard">
          <h3>Demo Accounts</h3>
          <table className="settingsTable">
            <thead>
              <tr><th>Role</th><th>Name</th><th>Credential</th></tr>
            </thead>
            <tbody>
              <tr><td>Owner</td><td>Jalaj</td><td>owner@2024</td></tr>
              <tr><td>Restaurant Manager</td><td>Arjun</td><td>manager@24</td></tr>
              <tr><td>Floor Manager</td><td>Priya</td><td>4455</td></tr>
              <tr><td>Server</td><td>Rahul</td><td>1122</td></tr>
              <tr><td>Kitchen</td><td>Kitchen</td><td>7788</td></tr>
            </tbody>
          </table>
        </div>
        <div className="settingsCard">
          <h3>Current Session</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Logged in:</strong> {user?.loginTime ? new Date(user.loginTime).toLocaleString() : "—"}</p>
        </div>
      </div>
    </div>
  );
}
