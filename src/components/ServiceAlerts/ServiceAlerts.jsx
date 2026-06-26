import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { serviceApi } from "../../services/api";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./ServiceAlerts.css";

const REQUEST_META = {
  bill_request: {
    icon: "Bill",
    label: "BILL REQUEST",
    title: "Bill Request",
    description: "Please prepare the bill for this table.",
  },
  call_waiter: {
    icon: "Alert",
    label: "WAITER CALL",
    title: "Waiter Call",
    description: "A guest needs server assistance.",
  },
  bussing_request: {
    icon: "Clean",
    label: "BUSSING REQUEST",
    title: "Bussing Request",
    description: "Please clear, clean, and reset the table for the next guests.",
  },
};

function elapsed(createdAt) {
  const secs = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h`;
}

function AlertCard({ request, onUpdate, user }) {
  const [timer, setTimer] = useState(elapsed(request.createdAt));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTimer(elapsed(request.createdAt)), 10000);
    return () => clearInterval(id);
  }, [request.createdAt]);

  const update = async (status) => {
    setUpdating(true);
    try {
      await serviceApi.updateStatus(request._id, status, { name: user?.name, role: user?.role });
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const meta = REQUEST_META[request.type] || {
    icon: "Alert",
    label: "SERVICE REQUEST",
    title: "Service Request",
    description: "A table needs service assistance.",
  };

  return (
    <motion.div
      className={`alertCard type-${request.type} status-${request.status}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="alertCardIcon">{meta.icon}</div>
      <div className="alertCardBody">
        <div className="alertCardHead">
          <span className="alertCardType">{meta.label}</span>
          <span className={`statusPill statusPill${request.status === "new" ? "New" : request.status === "acknowledged" ? "Preparing" : "Served"}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
        <h3 className="alertCardTable">{request.tableName || request.tableId}</h3>
        <p className="alertCardMessage">
          <strong>{meta.title}</strong> - {meta.description}
        </p>
        <p className="alertCardTime">
          {new Date(request.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          &nbsp;-&nbsp;Waiting: <strong>{timer}</strong>
        </p>
      </div>
      <div className="alertCardActions">
        {user?.role === "server" ? (
          <>
            {request.status === "new" && (
              <button className="btnSecondary alertBtn" onClick={() => update("acknowledged")} disabled={updating}>
                Acknowledge
              </button>
            )}
            {(request.status === "new" || request.status === "acknowledged") && (
              <button className="btnPrimary alertBtn" onClick={() => update("completed")} disabled={updating}>
                On My Way
              </button>
            )}
            {request.status === "completed" && (
              <span className="alertDone">On My Way</span>
            )}
          </>
        ) : (
          <span className="alertDone" style={{ opacity: 0.65 }}>
            {request.status === "new" ? "Pending" : request.status === "acknowledged" ? "Active" : "On My Way"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function ServiceAlerts({ onAck }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await serviceApi.getAll({ includeBussing: user?.role === "server" });
      let data = res.data || [];
      if (user?.role === "server") {
        data = data.filter((req) => !req.serverId || req.serverId === user.id);
      }
      const sorted = [...data].sort((a, b) => {
        const typeOrder = { bussing_request: 0, bill_request: 1, call_waiter: 2 };
        const tDiff = (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
        if (tDiff !== 0) return tDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setRequests(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    fetchRequests();

    const handleServiceNew = async (req) => {
      if (req.type === "bussing_request" && user?.role !== "server") return;

      // Resolve serverId dynamically
      try {
        const { data: tableData } = await supabase
          .from("tables")
          .select("current_session(server_id)")
          .eq("id", req.tableId)
          .maybeSingle();
        req.serverId = tableData?.current_session?.server_id || null;
      } catch (err) {
        console.error("Error resolving server for service request:", err);
      }

      if (user?.role === "server" && req.serverId && req.serverId !== user.id) {
        return; // Filter out if assigned to someone else
      }

      setRequests((prev) => {
        const exists = prev.some((r) => r._id === req._id);
        if (exists) return prev;
        return [req, ...prev];
      });
    };

    const handleServiceUpdated = async (updated) => {
      if (updated.type === "bussing_request" && user?.role !== "server") return;

      // Resolve serverId dynamically
      try {
        const { data: tableData } = await supabase
          .from("tables")
          .select("current_session(server_id)")
          .eq("id", updated.tableId)
          .maybeSingle();
        updated.serverId = tableData?.current_session?.server_id || null;
      } catch (err) {
        console.error("Error resolving server for service request:", err);
      }

      if (user?.role === "server" && updated.serverId && updated.serverId !== user.id) {
        setRequests((prev) => prev.filter((r) => r._id !== updated._id));
        return;
      }

      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      if (updated.status === "completed" && onAck) onAck();
    };

    socket.on("service:new", handleServiceNew);
    socket.on("service:updated", handleServiceUpdated);

    return () => {
      socket.off("service:new", handleServiceNew);
      socket.off("service:updated", handleServiceUpdated);
    };
  }, [fetchRequests, onAck, user]);

  const pending = requests.filter((r) => r.status === "new");
  const inProgress = requests.filter((r) => r.status === "acknowledged");
  const completed = requests.filter((r) => r.status === "completed");

  const visible = filter === "pending"
    ? [...pending, ...inProgress]
    : filter === "completed"
    ? completed
    : requests;

  const stats = {
    waiterCalls: pending.filter((r) => r.type === "call_waiter").length,
    billRequests: pending.filter((r) => r.type === "bill_request").length,
    bussingRequests: pending.filter((r) => r.type === "bussing_request").length,
    acknowledged: inProgress.length,
    completed: completed.length,
  };

  return (
    <div className="serviceAlertsPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Service Alerts</h2>
          <p className="dashPanelSub">Bussing, waiter calls & bill requests in real-time</p>
        </div>
        <button className="btnSecondary" onClick={fetchRequests}>Refresh</button>
      </div>

      <div className="statsBar">
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C04040" }}>{stats.bussingRequests}</span>
          <span className="statChipLabel">BUSSING REQUESTS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C04040" }}>{stats.billRequests}</span>
          <span className="statChipLabel">BILL REQUESTS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C8852A" }}>{stats.waiterCalls}</span>
          <span className="statChipLabel">WAITER CALLS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.acknowledged}</span>
          <span className="statChipLabel">IN PROGRESS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#48B076" }}>{stats.completed}</span>
          <span className="statChipLabel">COMPLETED</span>
        </div>
      </div>

      <div className="filterTabs" style={{ marginBottom: "1rem" }}>
        {[["pending", "Pending & Active"], ["completed", "Completed"], ["all", "All"]].map(([v, l]) => (
          <button key={v} className={`filterTab ${filter === v ? "activeTab" : ""}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="emptyState"><p className="emptyStateText">Loading alerts...</p></div>
      ) : visible.length === 0 ? (
        <div className="emptyState">
          <span className="emptyStateIcon">Alert</span>
          <p className="emptyStateText">No service requests</p>
        </div>
      ) : (
        <div className="alertsGrid">
          <AnimatePresence>
            {visible.map((req) => (
              <AlertCard key={req._id} request={req} onUpdate={fetchRequests} user={user} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
