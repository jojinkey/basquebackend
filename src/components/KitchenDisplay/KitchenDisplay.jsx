import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ordersApi } from "../../services/api";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "./KitchenDisplay.css";

function useOrderTimer(createdAt) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const update = () => setMins(Math.floor((Date.now() - new Date(createdAt)) / 60000));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [createdAt]);
  return mins;
}

function TimerBadge({ createdAt }) {
  const mins = useOrderTimer(createdAt);
  let cls = "timerBadge";
  if (mins >= 20) cls += " timerUrgent";
  else if (mins >= 10) cls += " timerWarn";
  return <span className={cls}>{mins}m</span>;
}

function OrderCard({ order, onStatusChange, can }) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await ordersApi.updateStatus(order._id, status);
      if (res?.data) {
        onStatusChange?.({ type: "update", order: res.data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await ordersApi.deleteOrder(order._id);
      onStatusChange?.({ type: "delete", id: order._id });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      className={`kdsCard status-${order.status}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="kdsCardHead">
        <div>
          <p className="kdsTableLabel">ORDER FROM</p>
          <h3 className="kdsTableId">{order.tableName || order.tableId}</h3>
          <p className="kdsTime">{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <TimerBadge createdAt={order.createdAt} />
      </div>

      <div className="kdsItems">
        {order.items.map((item, i) => (
          <div key={i} className="kdsItem">
            <span className="kdsItemName">{item.name}</span>
            <span className="kdsItemQty">×{item.qty}</span>
            <span className="kdsItemPrice">₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      <div className="kdsCardFoot">
        <span className="kdsTotalLabel">₹{order.total}</span>
        <div className="kdsActions">
          {order.status === "new" && can("kitchen_manage") && (
            <button className="kdsBtn kdsStart" onClick={() => handleStatus("preparing")} disabled={updating}>
              Start →
            </button>
          )}
          {order.status === "preparing" && can("kitchen_manage") && (
            <button className="kdsBtn kdsReady" onClick={() => handleStatus("served")} disabled={updating}>
              Ready →
            </button>
          )}
          {order.status === "served" && (
            <span className="kdsServedTag">✓ Served</span>
          )}
          {can("orders_manage") && order.status !== "served" && (
            <button className="kdsBtn kdsDelete" onClick={handleDelete} disabled={updating}>
              ✕
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function KitchenDisplay() {
  const { can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFlash, setNewFlash] = useState(false);
  const audioRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    socket.on("order:new", (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      setNewFlash(true);
      setTimeout(() => setNewFlash(false), 1500);
    });

    socket.on("order:updated", (updated) => {
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    });

    socket.on("order:deleted", (id) => {
      setOrders((prev) => prev.filter((o) => o._id !== id));
    });

    return () => {
      socket.off("order:new");
      socket.off("order:updated");
      socket.off("order:deleted");
    };
  }, [fetchOrders]);

  const pendingOrders   = orders.filter((o) => o.status === "pending");
  const newOrders      = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const servedOrders   = orders.filter((o) => o.status === "served").slice(0, 8);

  const approveOrder = async (id) => {
    try {
      await ordersApi.updateStatus(id, "approve");
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: "new" } : o)));
    } catch (e) { console.error(e); }
  };
  const declineOrder = async (id) => {
    if (!window.confirm("Decline and remove this order?")) return;
    try {
      await ordersApi.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (e) { console.error(e); }
  };

  const stats = {
    new: newOrders.length,
    preparing: preparingOrders.length,
    served: servedOrders.length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
  };

  const handleOrderChange = ({ type, order: updatedOrder, id }) => {
    setOrders((prev) => {
      switch (type) {
        case "update":
          return prev.map((ord) => (ord._id === updatedOrder._id ? { ...ord, ...updatedOrder } : ord));
        case "delete":
          return prev.filter((ord) => ord._id !== id);
        default:
          return prev;
      }
    });
  };

  if (loading) return <div className="emptyState"><p className="emptyStateText">Loading orders...</p></div>;

  return (
    <div className="kdsPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Kitchen Display</h2>
          <p className="dashPanelSub">Live order queue · {orders.length} active orders</p>
        </div>
        <button className="btnSecondary" onClick={fetchOrders}>Refresh</button>
      </div>

      <div className="statsBar">
        <div className="statChip"><span className="statChipValue" style={{ color: "#4A7AB5" }}>{stats.new}</span><span className="statChipLabel">NEW</span></div>
        <div className="statChip"><span className="statChipValue" style={{ color: "#C8852A" }}>{stats.preparing}</span><span className="statChipLabel">PREPARING</span></div>
        <div className="statChip"><span className="statChipValue" style={{ color: "#48B076" }}>{stats.served}</span><span className="statChipLabel">SERVED</span></div>
        <div className="statChip"><span className="statChipValue">₹{stats.revenue.toLocaleString()}</span><span className="statChipLabel">REVENUE</span></div>
      </div>

      {pendingOrders.length > 0 && can("orders_manage") && (
        <div className="kdsPendingBar">
          <div className="kdsPendingHead">
            <span>⏳ PENDING APPROVAL</span>
            <span className="kdsColBadge">{pendingOrders.length}</span>
          </div>
          <div className="kdsPendingCards">
            {pendingOrders.map((o) => (
              <div key={o._id} className="kdsPendingCard">
                <div>
                  <strong>{o.tableName}</strong>
                  <span className="kdsPendingItems">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ") || "Order"}</span>
                  <span className="kdsPendingTotal">₹{o.total}</span>
                </div>
                <div className="kdsPendingActions">
                  <button className="kdsBtn kdsStart" onClick={() => approveOrder(o._id)}>Approve →</button>
                  <button className="kdsBtn kdsDelete" onClick={() => declineOrder(o._id)}>Decline ✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="kdsColumns">
        <div className={`kdsColumn ${newFlash ? "columnFlash" : ""}`}>
          <div className="kdsColHeader kdsColHeaderNew">
            <span>NEW</span>
            <span className="kdsColBadge">{newOrders.length}</span>
          </div>
          <AnimatePresence>
            {newOrders.length === 0
              ? <div className="emptyState" style={{ padding: "2rem" }}><span className="emptyStateIcon">🍳</span><p className="emptyStateText">No new orders</p></div>
              : newOrders.map((o) => <OrderCard key={o._id} order={o} can={can} onStatusChange={handleOrderChange} />)
            }
          </AnimatePresence>
        </div>

        <div className="kdsColumn">
          <div className="kdsColHeader kdsColHeaderPreparing">
            <span>PREPARING</span>
            <span className="kdsColBadge">{preparingOrders.length}</span>
          </div>
          <AnimatePresence>
            {preparingOrders.length === 0
              ? <div className="emptyState" style={{ padding: "2rem" }}><span className="emptyStateIcon">⏳</span><p className="emptyStateText">No orders preparing</p></div>
              : preparingOrders.map((o) => <OrderCard key={o._id} order={o} can={can} onStatusChange={handleOrderChange} />)
            }
          </AnimatePresence>
        </div>

        <div className="kdsColumn">
          <div className="kdsColHeader kdsColHeaderServed">
            <span>SERVED</span>
            <span className="kdsColBadge">{servedOrders.length}</span>
          </div>
          <AnimatePresence>
            {servedOrders.length === 0
              ? <div className="emptyState" style={{ padding: "2rem" }}><span className="emptyStateIcon">✅</span><p className="emptyStateText">No orders served yet</p></div>
              : servedOrders.map((o) => <OrderCard key={o._id} order={o} can={can} onStatusChange={handleOrderChange} />)
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
