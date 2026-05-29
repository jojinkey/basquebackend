import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { serviceApi } from "../../services/api";
import { socket } from "../../services/socket";
import "./ServiceAlerts.css";

const STATUS_ORDER = { new: 0, acknowledged: 1, completed: 2 };

function elapsed(createdAt) {
  const secs = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h`;
}

function AlertCard({ request, onUpdate }) {
  const [timer, setTimer] = useState(elapsed(request.createdAt));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTimer(elapsed(request.createdAt)), 10000);
    return () => clearInterval(id);
  }, [request.createdAt]);

  const update = async (status) => {
    setUpdating(true);
    try {
      await serviceApi.updateStatus(request._id, status);
      onUpdate();
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const isBill = request.type === "bill_request";

  return (
    <motion.div
      className={`alertCard type-${request.type} status-${request.status}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="alertCardIcon">{isBill ? "🧾" : "🔔"}</div>
      <div className="alertCardBody">
        <div className="alertCardHead">
          <span className="alertCardType">{isBill ? "BILL REQUEST" : "WAITER CALL"}</span>
          <span className={`statusPill statusPill${request.status === "new" ? "New" : request.status === "acknowledged" ? "Preparing" : "Served"}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
        <h3 className="alertCardTable">{request.tableName || request.tableId}</h3>
        <p className="alertCardTime">
          {new Date(request.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          &nbsp;·&nbsp;Waiting: <strong>{timer}</strong>
        </p>
      </div>
      <div className="alertCardActions">
        {request.status === "new" && (
          <button className="btnSecondary alertBtn" onClick={() => update("acknowledged")} disabled={updating}>
            Acknowledge
          </button>
        )}
        {(request.status === "new" || request.status === "acknowledged") && (
          <button className="btnPrimary alertBtn" onClick={() => update("completed")} disabled={updating}>
            {request.status === "acknowledged" ? "On My Way ✓" : "Complete"}
          </button>
        )}
        {request.status === "completed" && (
          <span className="alertDone">✓ Done</span>
        )}
      </div>
    </motion.div>
  );
}

export default function ServiceAlerts({ onAck }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await serviceApi.getAll();
      const sorted = [...res.data].sort((a, b) => {
        const typeOrder = { bill_request: 0, call_waiter: 1 };
        const tDiff = (typeOrder[a.type] ?? 2) - (typeOrder[b.type] ?? 2);
        if (tDiff !== 0) return tDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setRequests(sorted);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchRequests();

    socket.on("service:new", (req) => {
      setRequests((prev) => {
        const exists = prev.some((r) => r._id === req._id);
        if (exists) return prev;
        return [req, ...prev];
      });
    });

    socket.on("service:updated", (updated) => {
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      if (updated.status === "completed" && onAck) onAck();
    });

    return () => {
      socket.off("service:new");
      socket.off("service:updated");
    };
  }, [fetchRequests, onAck]);

  const pending   = requests.filter((r) => r.status === "new");
  const inProgress = requests.filter((r) => r.status === "acknowledged");
  const completed  = requests.filter((r) => r.status === "completed");

  const visible = filter === "pending"
    ? [...pending, ...inProgress]
    : filter === "completed"
    ? completed
    : requests;

  const stats = {
    waiterCalls: pending.filter((r) => r.type === "call_waiter").length,
    billRequests: pending.filter((r) => r.type === "bill_request").length,
    acknowledged: inProgress.length,
    completed: completed.length,
  };

  return (
    <div className="serviceAlertsPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Service Alerts</h2>
          <p className="dashPanelSub">Waiter calls & bill requests in real-time</p>
        </div>
        <button className="btnSecondary" onClick={fetchRequests}>Refresh</button>
      </div>

      <div className="statsBar">
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
          <span className="emptyStateIcon">🔔</span>
          <p className="emptyStateText">No service requests</p>
        </div>
      ) : (
        <div className="alertsGrid">
          <AnimatePresence>
            {visible.map((req) => (
              <AlertCard key={req._id} request={req} onUpdate={fetchRequests} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
