import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { serviceApi, waitlistApi, reservationsApi } from "../services/api";
import { socket } from "../services/socket";
import { supabase } from "../lib/supabase";

import FloorPlan from "../components/FloorPlan/FloorPlan";
import KitchenDisplay from "../components/KitchenDisplay/KitchenDisplay";
import WaitlistModule from "../components/WaitlistModule/WaitlistModule";
import ServiceAlerts from "../components/ServiceAlerts/ServiceAlerts";
import ReservationPipeline from "../components/ReservationPipeline/ReservationPipeline";
import Insights from "../components/Insights/Insights";
import TableOrdering from "../components/TableOrdering/TableOrdering";
import AuditReports from "../components/AuditReports/AuditReports";
import OwnerGodView from "./OwnerGodView";
import ManagerDashboard from "./ManagerDashboard";
import EventsManager from "../components/EventsManager/EventsManager";
import ErrorBoundary from "../components/ErrorBoundary";

import "./DashboardPage.css";

const NAV = [
  { id: "god", label: "God View", icon: "👁", perm: "god_view" },
  { id: "floor", label: "Floor Plan", icon: "⊞", perm: "floor_view" },
  { id: "managerOrders", label: "Pending Orders", icon: "🧾", perm: "table_orders" },
  { id: "orders", label: "Kitchen Orders", icon: "🍳", perm: "kitchen_view" },
  { id: "tableOrders", label: "Table Ordering", icon: "🧾", perm: "table_orders" },
  { id: "alerts", label: "Service Alerts", icon: "🔔", perm: "service_alerts", badge: "alerts" },
  { id: "waitlist", label: "Waitlist & Queue", icon: "≡", perm: "waitlist_view", badge: "waitlist" },
  { id: "reservations", label: "Reservations", icon: "📋", perm: "reservations_view", badge: "reservations" },
  { id: "events", label: "Events CMS", icon: "🎪", perm: "events_manage" },
  { id: "insights", label: "Insights", icon: "⊙", perm: "insights" },
  { id: "activityLogs", label: "Activity Logs", icon: "🕒", perm: "audit_reports" },
  { id: "audit", label: "Audit Reports", icon: "📊", perm: "audit_reports" },
  { id: "settings", label: "Settings", icon: "⚙", perm: "settings" },
];

function getDefaultTab(can, isOwner) {
  if (isOwner) return "god";

  const order = [
    "floor",
    "managerOrders",
    "orders",
    "tableOrders",
    "alerts",
    "waitlist",
    "reservations",
    "insights",
    "activityLogs",
    "audit",
    "settings",
  ];

  for (const id of order) {
    const nav = NAV.find((n) => n.id === id);
    if (nav && can(nav.perm)) return id;
  }

  return "floor";
}

export default function DashboardPage() {
  const { user, can, logout, overrideMode, toggleOverride } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.role === "owner";

  const [activeTab, setActiveTab] = useState(() => getDefaultTab(can, isOwner));
  const [mobileOverlayTab, setMobileOverlayTab] = useState(null);

  const [badges, setBadges] = useState({
    alerts: 0,
    waitlist: 0,
    reservations: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [notifBar, setNotifBar] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Note 1 (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2 (E5, slightly offset)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.12, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.7);
    } catch (_) {}
  };

  useEffect(() => {
    loadBadges();

    socket.on("service:new", (req) => {
      setBadges((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      addActivity(
        `Table ${req.tableId} — ${
          req.type === "bill_request" ? "Bill Request" : "Waiter Call"
        }`
      );

      if (user?.role === "server") setActiveTab("alerts");

      if (user?.role !== "owner" && user?.role !== "owner_full") {
        setActiveAlert({
          type: "service",
          title: "Service Request Alert",
          message: `${req.tableName || `Table ${req.tableId}`} is calling for ${
            req.type === "bill_request" ? "the bill" : "a waiter"
          }`,
          targetTab: "alerts",
          icon: "🔔"
        });
        playChime();
      } else {
        setNotifBar(
          `🔔 ${req.tableName} is calling for ${
            req.type === "bill_request" ? "the bill" : "a waiter"
          }`
        );
        setTimeout(() => setNotifBar(null), 5000);
      }
    });

    socket.on("waitlist:added", (entry) => {
      setBadges((prev) => ({ ...prev, waitlist: prev.waitlist + 1 }));
      addActivity(`Walk-in: ${entry.guestName} (${entry.partySize} pax) added to queue`);

      if (user?.role !== "owner" && user?.role !== "owner_full") {
        setActiveAlert({
          type: "waitlist",
          title: "New Waitlist Added",
          message: `${entry.guestName} (${entry.partySize} guests) has been added to the queue`,
          targetTab: "waitlist",
          icon: "≡"
        });
        playChime();
      }
    });

    socket.on("waitlist:removed", () => {
      setBadges((prev) => ({
        ...prev,
        waitlist: Math.max(0, prev.waitlist - 1),
      }));
    });

    socket.on("reservation:new", (res) => {
      setBadges((prev) => ({ ...prev, reservations: prev.reservations + 1 }));
      addActivity(`New reservation lead: ${res.name} — ${res.service}`);

      if (user?.role !== "owner" && user?.role !== "owner_full") {
        setActiveAlert({
          type: "reservation",
          title: "New Reservation Lead",
          message: `${res.name} requested a reservation booking for ${res.service || "Dining"}`,
          targetTab: "reservations",
          icon: "📋"
        });
        playChime();
      }
    });

    socket.on("table:statusChanged", (table) => {
      addActivity(`Table ${table.tableId} → ${table.status.replace("_", " ")}`);
    });

    socket.on("order:new", (order) => {
      addActivity(`New order from ${order.tableName} — ₹${order.total}`);

      if (user?.role !== "owner" && user?.role !== "owner_full") {
        setActiveAlert({
          type: "order",
          title: "New Order Placed",
          message: `A new order of ₹${order.total.toLocaleString()} was placed from ${order.tableName}`,
          targetTab: "managerOrders",
          icon: "🧾"
        });
        playChime();
      }
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
    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setRecentActivity((prev) => [`${time} — ${msg}`, ...prev].slice(0, 8));
  };

  const handleAlertAck = () => {
    setBadges((prev) => ({
      ...prev,
      alerts: Math.max(0, prev.alerts - 1),
    }));
  };

  const WRITE_TABS = [
    "floor",
    "managerOrders",
    "orders",
    "tableOrders",
    "waitlist",
    "reservations",
  ];

  const showOverrideBtn = isOwner && !overrideMode && WRITE_TABS.includes(activeTab);

  const renderTabContent = (tabId) => {
    switch (tabId) {
      case "god":
        return <OwnerGodView />;

      case "floor":
        return <FloorPlan />;

      case "managerOrders":
        return <ManagerDashboard />;

      case "orders":
        return <KitchenDisplay />;

      case "waitlist":
        return <WaitlistModule />;

      case "alerts":
        return <ServiceAlerts onAck={handleAlertAck} />;

      case "tableOrders":
        return <TableOrdering />;

      case "reservations":
        return <ReservationPipeline />;

      case "insights":
        return <Insights />;

      case "activityLogs":
        return <ActivityLogs />;

      case "events":
        return <EventsManager />;

      case "audit":
        return <AuditReports />;

      case "settings":
        return <SettingsTab />;

      default:
        return null;
    }
  };

  const tabContent = () => renderTabContent(activeTab);

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

        {activeAlert && (
          <motion.div
            className="alertPopupOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="alertPopupCard"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <div className="alertPopupHeader">
                <span className="alertPopupIcon">{activeAlert.icon}</span>
                <h3 className="alertPopupTitle">{activeAlert.title}</h3>
              </div>
              <div className="alertPopupMessage">{activeAlert.message}</div>
              <div className="alertPopupActions">
                <button
                  className="alertPopupBtnSecondary"
                  onClick={() => setActiveAlert(null)}
                >
                  Dismiss
                </button>
                <button
                  className="alertPopupBtnPrimary"
                  onClick={() => {
                    setActiveTab(activeAlert.targetTab);
                    setActiveAlert(null);
                  }}
                >
                  View Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="dashSidebar">
        <div className="sidebarBrand">
          <p className="sidebarBrandName">BASQUE</p>
          <p className="sidebarBrandSub">MANAGER OS</p>
        </div>

        <div className="sidebarDivider" />

        <select
          className="mobileDashboardSelect"
          value={mobileOverlayTab || activeTab}
          onChange={(e) => {
            const selected = e.target.value;

            if (selected === "floor") {
              setActiveTab("floor");
              setMobileOverlayTab(null);
            } else {
              setMobileOverlayTab(selected);
            }
          }}
        >
          {NAV.map((item) => {
            if (!can(item.perm)) return null;

            const badgeCount = item.badge ? badges[item.badge] : 0;

            return (
              <option key={item.id} value={item.id}>
                {badgeCount > 0 ? `${item.label} (${badgeCount})` : item.label}
              </option>
            );
          })}
        </select>

        <nav className="sidebarNav">
          {NAV.map((item) => {
            if (!can(item.perm)) return null;

            const badgeCount = item.badge ? badges[item.badge] : 0;

            return (
              <button
                key={item.id}
                className={`sidebarNavItem ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOverlayTab(null);
                }}
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
              <p key={i} className="activityItem">
                {item}
              </p>
            ))}
          </div>
        )}

        <div className="sidebarDivider" />

        <div className="sidebarFooter">
          {can("audit_export") && (
            <button
              className="sidebarFooterBtn"
              onClick={() =>
                window.open("http://localhost:5000/api/audit/export", "_blank")
              }
            >
              Export Audit Log
            </button>
          )}

          <div className="sidebarUser">
            <p className="sidebarUserName">{user?.name}</p>
            <p className="sidebarUserRole">
              {user?.role?.replace("_", " ").toUpperCase()}
            </p>
          </div>

          <button
            className="logoutBtn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="dashMain">
        {showOverrideBtn && (
          <div className="overrideWarning">
            <div className="overrideCopy">
              You are in read-only Owner mode. To manipulate data in real time,
              enable Override. Actions are live and logged.
            </div>

            <button className="overrideBtn" onClick={toggleOverride}>
              Enable Override
            </button>
          </div>
        )}

        {overrideMode && isOwner && (
          <div className="overrideActive">
            Override ON — changes will apply immediately. Toggle off to return
            to read-only.
          </div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="dashContent"
        >
          <ErrorBoundary resetKey={activeTab}>{tabContent()}</ErrorBoundary>
        </motion.div>
      </main>

      {mobileOverlayTab && (
        <div className="mobileDashboardOverlay">
          <div className="mobileOverlayHeader">
            <div>
              <p className="mobileOverlayEyebrow">BASQUE MANAGER OS</p>
              <h2>
                {NAV.find((item) => item.id === mobileOverlayTab)?.label ||
                  "Section"}
              </h2>
            </div>

            <button
              className="mobileOverlayClose"
              onClick={() => setMobileOverlayTab(null)}
              aria-label="Close overlay"
            >
              ×
            </button>
          </div>

          <div className="mobileOverlayBody">
            <ErrorBoundary resetKey={mobileOverlayTab}>
              {renderTabContent(mobileOverlayTab)}
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ORDER_APPROVED", label: "Approved" },
  { value: "ORDER_REJECTED", label: "Rejected" },
  { value: "KITCHEN_STARTED", label: "Preparing" },
  { value: "ORDER_READY", label: "Ready" },
  { value: "ORDER_SERVED", label: "Served" },
  { value: "ORDER_DELETED_FROM_KITCHEN", label: "Deleted" },
  { value: "SERVICE_ACKNOWLEDGED", label: "Bill Acknowledged" },
  { value: "SERVICE_COMPLETED", label: "Bill Completed" },
];

function ActivityLogs() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageAcceptanceTime, setAverageAcceptanceTime] = useState("-");
  const [averageKitchenTime, setAverageKitchenTime] = useState("-");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const formatDuration = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return null;

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) return `${minutes}m ${seconds}s`;
    if (seconds > 0) return `${seconds}s`;
    return "<1s";
  };

  const getStatusBadge = (action) => {
    switch (action) {
      case "ORDER_APPROVED":
        return { className: "approved", label: "🟢 Approved" };
      case "ORDER_REJECTED":
        return { className: "rejected", label: "🔴 Rejected" };
      case "ORDER_CREATED":
        return { className: "created", label: "🟡 Created" };
      case "ORDER_READY":
        return { className: "ready", label: "🔵 Ready" };
      case "ORDER_SERVED":
        return { className: "served", label: "🟣 Served" };
      case "KITCHEN_STARTED":
        return { className: "preparing", label: "🟠 Preparing" };
      case "ORDER_DELETED_FROM_KITCHEN":
        return { className: "rejected", label: "🗑 Deleted" };
      case "ORDER_DECLINED_FROM_KITCHEN":
        return { className: "rejected", label: "🔴 Declined" };
      case "SERVICE_ACKNOWLEDGED":
        return { className: "created", label: "🧾 Bill Acknowledged" };
      case "SERVICE_COMPLETED":
        return { className: "approved", label: "✅ Bill Completed" };
      default:
        return { className: "default", label: action || "-" };
    }
  };

  const calculateAverages = (logs, createdLogMap) => {
    const approvalDurations = [];
    const kitchenDurations = [];

    const approvedLogs = logs.filter((l) => l.action === "ORDER_APPROVED" && l.order_id && l.created_at);
    approvedLogs.forEach((log) => {
      const createdAt = createdLogMap[log.order_id];
      if (createdAt) {
        const diff = new Date(log.created_at) - new Date(createdAt);
        if (diff >= 0) approvalDurations.push(diff);
      }
    });

    // Group KITCHEN_STARTED → ORDER_READY pairs
    const groupedByOrder = {};
    logs.forEach((log) => {
      if (!log.order_id) return;
      if (!groupedByOrder[log.order_id]) groupedByOrder[log.order_id] = {};
      groupedByOrder[log.order_id][log.action] = log.created_at;
    });

    Object.values(groupedByOrder).forEach((orderLogs) => {
      if (orderLogs.KITCHEN_STARTED && orderLogs.ORDER_READY) {
        const diff = new Date(orderLogs.ORDER_READY) - new Date(orderLogs.KITCHEN_STARTED);
        if (diff >= 0) kitchenDurations.push(diff);
      }
    });

    const avgAcceptance = approvalDurations.length > 0
      ? approvalDurations.reduce((s, v) => s + v, 0) / approvalDurations.length
      : null;

    const avgKitchen = kitchenDurations.length > 0
      ? kitchenDurations.reduce((s, v) => s + v, 0) / kitchenDurations.length
      : null;

    setAverageAcceptanceTime(avgAcceptance !== null ? formatDuration(avgAcceptance) ?? "-" : "-");
    setAverageKitchenTime(avgKitchen !== null ? formatDuration(avgKitchen) ?? "-" : "-");
  };

  const fetchActivityLogs = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("order_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;

      // Collect all unique order IDs (service logs have no order_id)
      const orderIds = [...new Set((logs || []).map((l) => l.order_id).filter(Boolean))];

      // Build baseline map: earliest log timestamp per order_id
      // This avoids depending on the orders table (which may have RLS or deleted rows)
      const createdLogMap = {};

      if (orderIds.length > 0) {
        // Fetch ALL logs for these order IDs (not just the latest 300)
        // so we always get the earliest entry as the baseline
        const { data: allLogsForOrders } = await supabase
          .from("order_logs")
          .select("order_id, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });

        (allLogsForOrders || []).forEach((log) => {
          if (log.order_id && log.created_at) {
            // Keep only the earliest (first) timestamp per order
            if (!createdLogMap[log.order_id]) {
              createdLogMap[log.order_id] = log.created_at;
            }
          }
        });

        // Also try the orders table as a fallback for more accurate created_at
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, created_at")
          .in("id", orderIds);

        (ordersData || []).forEach((order) => {
          if (order.id && order.created_at) {
            // Use orders table time if it's earlier than first log
            const existing = createdLogMap[order.id];
            if (!existing || new Date(order.created_at) < new Date(existing)) {
              createdLogMap[order.id] = order.created_at;
            }
          }
        });
      }

      const updatedLogs = (logs || []).map((log) => {
        let acceptedIn = null;

        if (log.order_id) {
          const createdAt = createdLogMap[log.order_id];
          if (createdAt && log.created_at) {
            const diff = new Date(log.created_at) - new Date(createdAt);
            // If diff is 0 or very small, this IS the first log — show <1s or skip
            acceptedIn = diff > 500 ? formatDuration(diff) : null;
          }
        }

        return { ...log, acceptedIn };
      });

      calculateAverages(logs || [], createdLogMap);
      setActivityLogs(updatedLogs);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();

    const logsChannel = supabase
      .channel("dashboard-activity-logs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_logs" },
        () => fetchActivityLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const filteredLogs =
    statusFilter === "ALL"
      ? activityLogs
      : activityLogs.filter((log) => log.action === statusFilter);

  return (
    <section className="dashboardPanel">
      <div className="dashPanelHeader">
        <h2 className="dashPanelTitle">Activity Logs</h2>

        <button className="btnSecondary" onClick={fetchActivityLogs}>
          Refresh
        </button>
      </div>

      <div className="activitySummaryGrid">
        <div className="activitySummaryCard">
          <span>Average Acceptance Time</span>
          <strong>{averageAcceptanceTime}</strong>
          <p>ORDER_CREATED → ORDER_APPROVED</p>
        </div>

        <div className="activitySummaryCard">
          <span>Average Kitchen Cooking Time</span>
          <strong>{averageKitchenTime}</strong>
          <p>KITCHEN_STARTED → ORDER_READY</p>
        </div>
      </div>

      <div className="filterTabs">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`filterTab ${statusFilter === opt.value ? "activeTab" : ""}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="emptyBox">Loading activity logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="emptyBox">No activity logs for this filter.</p>
      ) : (
        <div className="activityTableWrapper">
          <table className="activityTable">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Table</th>
                <th>Order ID</th>
                <th>User</th>
                <th>Accepted In</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => {
                const status = getStatusBadge(log.action);

                return (
                  <tr key={log.id}>
                    <td>
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("en-IN")
                        : "-"}
                    </td>

                    <td>{log.action || "-"}</td>

                    <td>{log.table_id || "-"}</td>

                    <td>{log.order_id ? log.order_id.substring(0, 8) : "-"}</td>

                    <td>{log.performed_by || "-"}</td>

                    <td>
                      {log.acceptedIn ? (
                        <span style={{ color: "#48b076", fontWeight: 700 }}>
                          {log.acceptedIn}
                        </span>
                      ) : (
                        <span style={{ color: "#C8C0B8" }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className={`statusBadge ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);

  const runRpc = async (fn, label, confirmText) => {
    if (!window.confirm(confirmText)) return;

    setBusy(fn);
    setMsg(null);

    try {
      const { error } = await supabase.rpc(fn);
      if (error) throw error;

      setMsg({
        ok: true,
        text: `${label} complete. Refresh any open tab to see the change.`,
      });
    } catch (e) {
      setMsg({
        ok: false,
        text: `${label} failed: ${e.message || "unknown error"}`,
      });
    } finally {
      setBusy("");
      setTimeout(() => setMsg(null), 6000);
    }
  };

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
              <tr>
                <th>Role</th>
                <th>Name</th>
                <th>Credential</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Owner</td>
                <td>Avantika</td>
                <td>owner@2024</td>
              </tr>

              <tr>
                <td>Restaurant Manager</td>
                <td>Arjun</td>
                <td>manager@24</td>
              </tr>

              <tr>
                <td>Floor Manager</td>
                <td>Priya</td>
                <td>4455</td>
              </tr>

              <tr>
                <td>Server</td>
                <td>Rahul</td>
                <td>1122</td>
              </tr>

              <tr>
                <td>Kitchen</td>
                <td>Kitchen</td>
                <td>7788</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="settingsCard">
          <h3>Current Session</h3>

          <p>
            <strong>Name:</strong> {user?.name}
          </p>

          <p>
            <strong>Role:</strong> {user?.role}
          </p>

          <p>
            <strong>Logged in:</strong>{" "}
            {user?.loginTime ? new Date(user.loginTime).toLocaleString() : "—"}
          </p>
        </div>

        <div className="settingsCard">
          <h3>Data Management</h3>

          <p
            style={{
              fontSize: "0.82rem",
              color: "#8C7B6A",
              marginBottom: "1rem",
            }}
          >
            Restore the demo scenario, or wipe everything to a clean slate.
            These actions are immediate and apply to every connected device.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              className="btnSecondary"
              disabled={!!busy}
              onClick={() =>
                runRpc(
                  "reset_demo_data",
                  "Reset to demo data",
                  "Reset all data back to the demo scenario?\n\nClears current orders/sessions/waitlist and restores the sample evening. Real website reservations are kept."
                )
              }
            >
              {busy === "reset_demo_data" ? "Resetting…" : "↺ Reset Demo Data"}
            </button>

            <button
              className="btnDanger"
              disabled={!!busy}
              onClick={() =>
                runRpc(
                  "clear_all_data",
                  "Clear all data",
                  "⚠ Clear ALL data?\n\nThis permanently deletes every order, session, waitlist entry, service request, audit log AND all reservations, then resets all 18 tables to available. This cannot be undone."
                )
              }
            >
              {busy === "clear_all_data" ? "Clearing…" : "🗑 Clear All Data"}
            </button>
          </div>

          {msg && (
            <p
              style={{
                marginTop: "0.9rem",
                fontSize: "0.8rem",
                color: msg.ok ? "#48B076" : "#C04040",
              }}
            >
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}