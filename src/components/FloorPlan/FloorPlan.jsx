import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tablesApi, ordersApi, serviceApi } from "../../services/api";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "./FloorPlan.css";

const SECTIONS = ["All", "Indoor", "Terrace", "Garden", "Bar"];

const STATUS_LABELS = {
  available: "Available",
  seated: "Seated",
  reserved: "Reserved",
  needs_bussing: "Needs Bussing",
};

const STATUS_FLOW = {
  available: ["reserved", "seated"],
  reserved: ["seated", "available"],
  seated: ["needs_bussing"],
  needs_bussing: ["available"],
};

function elapsed(seatedAt) {
  if (!seatedAt) return null;
  const mins = Math.floor((Date.now() - new Date(seatedAt)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function orderStatusIcon(orders) {
  if (!orders || orders.length === 0) return null;
  const statuses = orders.map((o) => o.status);
  if (statuses.includes("new")) return { icon: "🟡", label: `${orders.length} item${orders.length > 1 ? "s" : ""}` };
  if (statuses.includes("preparing")) return { icon: "🟢", label: `${orders.length} item${orders.length > 1 ? "s" : ""}` };
  if (statuses.every((s) => s === "served")) return { icon: "✅", label: "Served" };
  return { icon: "🟢", label: `${orders.length} orders` };
}

function TableCard({ table, isSelected, onClick }) {
  const orderBadge = orderStatusIcon(table.activeOrders);
  const hasAlert = table.serviceRequests?.some((r) => r.status === "new");
  const hasBillReq = table.serviceRequests?.some((r) => r.status === "new" && r.type === "bill_request");

  let cardClass = `floorTableCard status-${table.status}`;
  if (isSelected) cardClass += " selected";
  if (table.isVip) cardClass += " vip";

  return (
    <motion.div
      className={cardClass}
      onClick={() => onClick(table)}
      whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(44,26,14,0.14)" }}
      layout
    >
      <div className="tableCardTop">
        <span className="tableCardId">{table.tableId}</span>
        <span className="tableCardPax">{table.pax} pax</span>
      </div>

      {table.isVip && <span className="tableVip">★ VIP</span>}

      {table.guest && (
        <p className="tableCardGuest">{table.guest}</p>
      )}

      {table.assignedServer && (
        <p className="tableCardServer">🤵 {table.assignedServer.name}</p>
      )}

      {table.seatedAt && (
        <p className="tableCardTime">{elapsed(table.seatedAt)} seated</p>
      )}

      {table.reservation && table.status === "reserved" && (
        <p className="tableCardRes">Res: {table.reservation}</p>
      )}

      <div className="tableCardBadges">
        {orderBadge && (
          <span className="tableOrderBadge">
            {orderBadge.icon} {orderBadge.label}
            {table.activeOrders?.[0]?.total ? ` · ₹${table.activeOrders.reduce((s, o) => s + o.total, 0)}` : ""}
          </span>
        )}
        {hasBillReq && <span className="tableAlertBadge">🧾 Bill Requested</span>}
        {hasAlert && !hasBillReq && <span className="tableAlertBadge">🔔 Waiter Called</span>}
      </div>

      <div className={`tableStatusBar status-${table.status}`} />
    </motion.div>
  );
}

function TableDetailPanel({ table, onClose, onStatusChange, user }) {
  const [newStatus, setNewStatus] = useState("");
  const [guestName, setGuestName] = useState(table.guest || "");
  const [isVip, setIsVip] = useState(table.isVip || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGuestName(table.guest || "");
    setIsVip(table.isVip || false);
  }, [table]);

  const orderTotal = table.activeOrders?.reduce((s, o) => s + o.total, 0) || 0;
  const nextStatuses = STATUS_FLOW[table.status] || [];
  const hasOpenBussingRequest = table.serviceRequests?.some(
    (r) => r.status !== "completed" && r.type === "bussing_request"
  );

  const handleBussingRequest = async () => {
    setSaving(true);
    try {
      await serviceApi.create(
        table.tableId,
        table.tableName || `Table ${table.tableId}`,
        "bussing_request",
        { name: user?.name, role: user?.role }
      );
      onStatusChange();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    setSaving(true);
    try {
      await tablesApi.updateStatus(table.tableId, {
        status,
        guest: status === "seated" ? guestName : undefined,
        isVip: status === "seated" ? isVip : undefined,
        performer: { name: user?.name, role: user?.role },
      });

      if (status === "needs_bussing") {
        await serviceApi.create(
          table.tableId,
          table.tableName || `Table ${table.tableId}`,
          "bussing_request",
          { name: user?.name, role: user?.role }
        );
      }

      onStatusChange();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <motion.div
        className="drawer tableDetailDrawer"
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="drawerHeader">
          <div>
            <h2 className="drawerTitle">Table {table.tableId}</h2>
            <p className="dashPanelSub">{table.section} · {table.pax} pax</p>
          </div>
          <button className="drawerClose" onClick={onClose}>✕</button>
        </div>

        {table.guest && (
          <div className="detailSection">
            <p className="detailSectionTitle">GUEST</p>
            <p className="detailGuestName">{table.guest} {table.isVip && "★"}</p>
            {table.assignedServer && <p className="detailSub">🤵 Server: {table.assignedServer.name}</p>}
            {table.seatedAt && <p className="detailSub">{elapsed(table.seatedAt)} seated</p>}
            {table.reservation && <p className="detailSub">Reservation: {table.reservation}</p>}
          </div>
        )}

        {table.status === "available" || table.status === "reserved" ? (
          <div className="detailSection">
            <p className="detailSectionTitle">SEAT GUEST</p>
            <div className="formGroup">
              <label className="formLabel">GUEST NAME</label>
              <input
                className="formInput"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name"
              />
            </div>
            <div className="toggleSwitch" onClick={() => setIsVip((p) => !p)} style={{ marginTop: "0.75rem" }}>
              <div className={`toggleTrack ${isVip ? "on" : ""}`}>
                <div className="toggleThumb" />
              </div>
              <span className="formLabel">VIP Guest</span>
            </div>
          </div>
        ) : null}

        {table.activeOrders?.length > 0 && (
          <div className="detailSection">
            <p className="detailSectionTitle">ACTIVE ORDER</p>
            {table.activeOrders.map((order) => (
              <div key={order._id} className="detailOrderBlock">
                {order.items.map((item, i) => (
                  <div key={i} className="detailOrderItem">
                    <span>{item.name} ×{item.qty}</span>
                    <strong>₹{item.price * item.qty}</strong>
                  </div>
                ))}
                <div className="detailOrderTotal">
                  <span>Total</span>
                  <strong>₹{order.total}</strong>
                </div>
                <span className={`statusPill statusPill${order.status === "new" ? "New" : order.status === "preparing" ? "Preparing" : "Served"}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {table.serviceRequests?.filter((r) => r.status === "new").length > 0 && (
          <div className="detailSection">
            <p className="detailSectionTitle">SERVICE REQUESTS</p>
            {table.serviceRequests.filter((r) => r.status === "new").map((req) => (
              <div key={req._id} className="detailServiceReq">
                <span>{req.type === "bill_request" ? "🧾 Bill Request" : "🔔 Waiter Call"}</span>
                <span className="detailSub">{new Date(req.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        )}

        <div className="detailSection">
          <p className="detailSectionTitle">QUICK ACTIONS</p>
          <div className="detailActions">
            {table.status === "needs_bussing" && !hasOpenBussingRequest && (
              <button
                className="btnDanger"
                onClick={handleBussingRequest}
                disabled={saving}
                style={{ fontSize: "0.7rem" }}
              >
                Request Bussing
              </button>
            )}
            {nextStatuses.map((status) => (
              <button
                key={status}
                className={status === "needs_bussing" || status === "available" ? "btnDanger" : "btnPrimary"}
                onClick={() => handleStatusChange(status)}
                disabled={saving}
                style={{ fontSize: "0.7rem" }}
              >
                {status === "seated" ? "Seat Guest" :
                 status === "available" ? "Clear Table" :
                 status === "needs_bussing" ? "Request Bussing" :
                 status === "reserved" ? "Mark Reserved" :
                 STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function FloorPlan() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [section, setSection] = useState("All");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [selectedTableId, setSelectedTableId] = useState(null);

  const selectedTableObj = tables.find((t) => t.tableId === selectedTableId);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const res = await tablesApi.getAll();
      setTables(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await tablesApi.getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchStats();

    const handleTableStatusChanged = () => {
      fetchTables();
      fetchStats();
    };

    socket.on("table:statusChanged", handleTableStatusChanged);
    socket.on("order:new", fetchTables);
    socket.on("order:updated", fetchTables);
    socket.on("service:new", fetchTables);
    socket.on("service:updated", fetchTables);

    return () => {
      socket.off("table:statusChanged", handleTableStatusChanged);
      socket.off("order:new", fetchTables);
      socket.off("order:updated", fetchTables);
      socket.off("service:new", fetchTables);
      socket.off("service:updated", fetchTables);
    };
  }, [fetchTables, fetchStats]);

  const filtered = tables.filter((t) => {
    const matchesSection = section === "All" || t.section === section;
    let matchesOccupancy = true;
    if (occupancyFilter === "occupied") {
      matchesOccupancy = t.status === "seated" || t.status === "needs_bussing";
    } else if (occupancyFilter === "vacant") {
      matchesOccupancy = t.status === "available" || t.status === "reserved";
    }
    return matchesSection && matchesOccupancy;
  });

  const sectionSummary = ["Indoor", "Terrace", "Garden", "Bar"].map((s) => {
    const sec = tables.filter((t) => t.section === s);
    const occ = sec.filter((t) => t.status === "seated" || t.status === "needs_bussing").length;
    return { section: s, occupied: occ, total: sec.length };
  });

  return (
    <div className="floorPlanPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Floor Plan</h2>
          <p className="dashPanelSub">Basque Dehradun · 18 tables · 4 sections</p>
        </div>
        <button className="btnSecondary" onClick={() => { fetchTables(); fetchStats(); }}>
          Refresh
        </button>
      </div>

      <div className="statsBar">
        <div className="statChip">
          <span className="statChipValue">{stats.available ?? "—"}</span>
          <span className="statChipLabel">AVAILABLE</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.seated ?? "—"}</span>
          <span className="statChipLabel">SEATED</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C04040" }}>{stats.needsBussing ?? "—"}</span>
          <span className="statChipLabel">BUSSING</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.avgDuration ?? "—"}m</span>
          <span className="statChipLabel">AVG DURATION</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.reserved ?? "—"}</span>
          <span className="statChipLabel">RESERVED</span>
        </div>
      </div>

      <div className="sectionSummaryStrip">
        {sectionSummary.map((s) => (
          <div key={s.section} className="sectionSummaryItem">
            <span className="sectionSummaryName">{s.section}</span>
            <span className="sectionSummaryCount">{s.occupied}/{s.total} occupied</span>
          </div>
        ))}
      </div>

      <div className="filterRow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div className="filterTabs" style={{ marginBottom: 0 }}>
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`filterTab ${section === s ? "activeTab" : ""}`}
              onClick={() => setSection(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="filterTabs" style={{ marginBottom: 0, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "0.65rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: "#8C7B6A", marginRight: "0.75rem" }}>OCCUPANCY:</span>
          <button
            className={`filterTab ${occupancyFilter === "all" ? "activeTab" : ""}`}
            onClick={() => setOccupancyFilter("all")}
          >
            All
          </button>
          <button
            className={`filterTab ${occupancyFilter === "occupied" ? "activeTab" : ""}`}
            onClick={() => setOccupancyFilter("occupied")}
          >
            Occupied
          </button>
          <button
            className={`filterTab ${occupancyFilter === "vacant" ? "activeTab" : ""}`}
            onClick={() => setOccupancyFilter("vacant")}
          >
            Vacant
          </button>
        </div>
      </div>

      {loading ? (
        <div className="emptyState"><p className="emptyStateText">Loading tables...</p></div>
      ) : (
        <div className="floorGrid">
          {filtered.map((table) => (
            <TableCard
              key={table.tableId}
              table={table}
              isSelected={selectedTableId === table.tableId}
              onClick={(t) => setSelectedTableId(t.tableId)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTableObj && (
          <TableDetailPanel
            table={selectedTableObj}
            user={user}
            onClose={() => setSelectedTableId(null)}
            onStatusChange={() => { fetchTables(); fetchStats(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
