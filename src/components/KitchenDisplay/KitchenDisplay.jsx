import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ordersApi } from "../../services/api";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./KitchenDisplay.css";

const STARTED_KEY = "basque_started_kitchen_orders";

const getOrderId = (order) => order?.id || order?._id;

const getStartedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(STARTED_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveStartedIds = (ids) => {
  localStorage.setItem(STARTED_KEY, JSON.stringify(ids));
};

const logOrderAction = async ({ orderId = null, tableId = null, action, performedBy }) => {
  const { error } = await supabase.from("order_logs").insert({
    order_id: orderId,
    table_id: tableId,
    action,
    performed_by: performedBy,
  });
  if (error) console.error("Kitchen log failed:", error);
};

function useOrderTimer(createdAt) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const update = () => {
      if (!createdAt) { setMins(0); return; }
      setMins(Math.floor((Date.now() - new Date(createdAt)) / 60000));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [createdAt]);
  return mins;
}

function TimerBadge({ createdAt }) {
  const mins = useOrderTimer(createdAt);
  let cls = "kdsTimerBadge";
  if (mins >= 20) cls += " timerUrgent";
  else if (mins >= 10) cls += " timerWarn";
  return <span className={cls}>{mins}m</span>;
}

// Compact expandable order strip
function OrderCard({ order, isActive, onClick }) {
  const mins = useOrderTimer(order.createdAt);

  let timerCls = "kdsCardTimer";
  if (mins >= 20) timerCls += " timerUrgent";
  else if (mins >= 10) timerCls += " timerWarn";

  const itemCount = order.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

  return (
    <button
      className={`kdsMasterCard status-${order.status} ${isActive ? "kdsCardActive" : ""}`}
      onClick={onClick}
    >
      <div className="kdsCardHead">
        <strong className="kdsCardTable">{order.tableName || order.tableId || "Table ?"}</strong>
        <span className={timerCls}>{mins}m</span>
      </div>
      <div className="kdsCardBodySummary">
        <span className="kdsCardCount">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        <span className="kdsCardTotal">₹{order.total}</span>
      </div>
    </button>
  );
}

function OrderDetail({ order, onStart, onReady, onServed, onDelete, can }) {
  const [updating, setUpdating] = useState(false);
  const orderId = getOrderId(order);

  const runAction = async (fn) => {
    setUpdating(true);
    try { await fn(); }
    catch (e) { console.error("Kitchen action failed:", e); alert(e?.message || "Failed to update order"); }
    finally { setUpdating(false); }
  };

  if (!order) {
    return (
      <div className="kdsDetailEmpty">
        <div className="kdsDetailEmptyIcon">🍳</div>
        <p className="kdsDetailEmptyText">Select an order to view items</p>
      </div>
    );
  }

  const statusLabel = {
    new: "New Order",
    placed: "Placed",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
  }[order.status] || order.status?.toUpperCase();

  return (
    <div className="kdsDetailContent">
      <div className="kdsDetailHeader">
        <div>
          <span className={`kdsDetailStatusBadge status-${order.status}`}>{statusLabel}</span>
          <h2 className="kdsDetailTitle">{order.tableName || order.tableId || "Table ?"}</h2>
        </div>
        {order.createdAt && (
          <span className="kdsDetailTime">
            Ordered {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="kdsDetailItemsScroll">
        <div className="kdsDetailItemsHeader">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div className="kdsDetailItemsList">
          {order.items?.map((item, i) => (
            <div key={i} className="kdsDetailItemRow">
              <span className="kdsDetailItemName">{item.name}</span>
              <span className="kdsDetailItemQty">×{item.qty}</span>
              <span className="kdsDetailItemPrice">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="kdsDetailTotalRow">
          <span>Grand Total</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <div className="kdsDetailActions">
        <div className="kdsDetailActionGroup">
          {(order.status === "new" || order.status === "placed") && can("kitchen_manage") && (
            <button
              className="btnPrimary kdsLargeActionBtn"
              onClick={() => runAction(() => onStart(orderId))}
              disabled={updating}
            >
              Start Preparing →
            </button>
          )}
          {order.status === "preparing" && can("kitchen_manage") && (
            <button
              className="btnPrimary kdsLargeActionBtn kdsReadyBtn"
              onClick={() => runAction(() => onReady(orderId))}
              disabled={updating}
            >
              Mark Ready →
            </button>
          )}
          {order.status === "ready" && can("kitchen_manage") && (
            <button
              className="btnPrimary kdsLargeActionBtn kdsServedBtn"
              onClick={() => runAction(() => onServed(orderId))}
              disabled={updating}
            >
              Mark Served →
            </button>
          )}
          {order.status === "served" && (
            <div className="kdsServedBanner">✓ Order completed and served</div>
          )}
        </div>

        {can("orders_manage") && (order.status === "new" || order.status === "placed") && (
          <button
            className="btnDanger kdsCancelBtn"
            onClick={() => runAction(() => onDelete(orderId))}
            disabled={updating}
          >
            ✕ Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const { can } = useAuth();

  const [orders, setOrders] = useState([]);
  const [startedIds, setStartedIds] = useState(getStartedIds);
  const [loading, setLoading] = useState(true);
  const [newFlash, setNewFlash] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const getTableIdByOrderId = useCallback((id) => {
    const order = orders.find((o) => getOrderId(o) === id);
    return order?.tableId || order?.tableName || null;
  }, [orders]);

  const markStarted = useCallback((id) => {
    setStartedIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      saveStartedIds(next);
      return next;
    });
  }, []);

  const unmarkStarted = useCallback((id) => {
    setStartedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveStartedIds(next);
      return next;
    });
  }, []);

  const shapeKitchenOrders = useCallback((rows) => {
    return (rows || []).map((order) => {
      const id = getOrderId(order);
      if (startedIds.includes(id) && (order.status === "new" || order.status === "placed")) {
        return { ...order, status: "preparing" };
      }
      return order;
    });
  }, [startedIds]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAll();
      setOrders(shapeKitchenOrders(res.data || []));
    } catch (e) {
      console.error("Failed to fetch kitchen orders:", e);
    } finally {
      setLoading(false);
    }
  }, [shapeKitchenOrders]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
        setNewFlash(true);
        setTimeout(() => setNewFlash(false), 1500);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  useEffect(() => {
    setOrders((prev) => shapeKitchenOrders(prev));
  }, [startedIds, shapeKitchenOrders]);

  const handleStart = async (id) => {
    const tableId = getTableIdByOrderId(id);
    markStarted(id);
    await supabase.from("orders").update({ kitchen_started_at: new Date().toISOString() }).eq("id", id);
    await logOrderAction({ orderId: id, tableId, action: "KITCHEN_STARTED", performedBy: "KITCHEN" });
    setOrders((prev) => prev.map((o) => getOrderId(o) === id ? { ...o, status: "preparing" } : o));
  };

  const handleReady = async (id) => {
    const tableId = getTableIdByOrderId(id);
    await ordersApi.updateStatus(id, "ready");
    await supabase.from("orders").update({ ready_at: new Date().toISOString() }).eq("id", id);
    await logOrderAction({ orderId: id, tableId, action: "ORDER_READY", performedBy: "KITCHEN" });
    unmarkStarted(id);
    setOrders((prev) => prev.map((o) => getOrderId(o) === id ? { ...o, status: "ready" } : o));
    await fetchOrders();
  };

  const handleServed = async (id) => {
    const tableId = getTableIdByOrderId(id);
    await ordersApi.updateStatus(id, "served");
    await supabase.from("orders").update({ served_at: new Date().toISOString() }).eq("id", id);
    await logOrderAction({ orderId: id, tableId, action: "ORDER_SERVED", performedBy: "KITCHEN" });
    unmarkStarted(id);
    setOrders((prev) => prev.map((o) => getOrderId(o) === id ? { ...o, status: "served" } : o));
    await fetchOrders();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    const tableId = getTableIdByOrderId(id);
    try {
      await logOrderAction({ orderId: id, tableId, action: "ORDER_DELETED_FROM_KITCHEN", performedBy: "KITCHEN" });
      const { error: orderError } = await supabase.from("orders").delete().eq("id", id);
      if (orderError) {
        await supabase.from("order_items").delete().eq("order_id", id);
        const { error: retryError } = await supabase.from("orders").delete().eq("id", id);
        if (retryError) throw retryError;
      }
      unmarkStarted(id);
      setOrders((prev) => prev.filter((o) => getOrderId(o) !== id));
      if (selectedOrderId === id) {
        setSelectedOrderId(null);
      }
    } catch (e) {
      console.error("Cancel order failed:", e);
      alert(`Failed to cancel order: ${e?.message || "Unknown error"}`);
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "pending_approval");
  const newOrders = orders.filter(o => o.status === "new" || o.status === "placed");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  const servedOrders = orders.filter(o => o.status === "served").slice(0, 8);

  const approveOrder = async (id) => {
    try {
      await ordersApi.updateStatus(id, "placed");
      setOrders((prev) => prev.map(o => getOrderId(o) === id ? { ...o, status: "placed" } : o));
      await fetchOrders();
    } catch (e) { console.error("Approve failed:", e); }
  };

  const declineOrder = async (id) => {
    if (!window.confirm("Decline and remove this order?")) return;
    try {
      const tableId = getTableIdByOrderId(id);
      await logOrderAction({ orderId: id, tableId, action: "ORDER_DECLINED_FROM_KITCHEN", performedBy: "KITCHEN" });
      const { error: orderError } = await supabase.from("orders").delete().eq("id", id);
      if (orderError) {
        await supabase.from("order_items").delete().eq("order_id", id);
        const { error: retryError } = await supabase.from("orders").delete().eq("id", id);
        if (retryError) throw retryError;
      }
      unmarkStarted(id);
      setOrders((prev) => prev.filter(o => getOrderId(o) !== id));
      if (selectedOrderId === id) {
        setSelectedOrderId(null);
      }
    } catch (e) {
      console.error("Decline failed:", e);
      alert(`Failed to decline order: ${e?.message || "Unknown error"}`);
    }
  };

  // Auto-select first order in active queue when order list or selection changes
  useEffect(() => {
    const activeQueue = [...newOrders, ...preparingOrders, ...readyOrders, ...servedOrders];
    if (activeQueue.length > 0) {
      const exists = activeQueue.some(o => getOrderId(o) === selectedOrderId);
      if (!exists) {
        setSelectedOrderId(getOrderId(activeQueue[0]));
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [orders, selectedOrderId, newOrders.length, preparingOrders.length, readyOrders.length, servedOrders.length]);

  const stats = {
    new: newOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
    served: servedOrders.length,
  };

  if (loading) {
    return (
      <div className="emptyState"><p className="emptyStateText">Loading orders...</p></div>
    );
  }

  const selectedOrder = orders.find(o => getOrderId(o) === selectedOrderId);

  return (
    <div className="kdsPage">
      {/* Header */}
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Kitchen Display</h2>
          <p className="dashPanelSub">Live order queue · {orders.length} active orders</p>
        </div>
        <button className="btnSecondary" onClick={fetchOrders}>Refresh</button>
      </div>

      {/* Stats bar */}
      <div className="statsBar">
        <div className="statChip">
          <span className="statChipValue">{stats.new}</span>
          <span className="statChipLabel">NEW</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.preparing}</span>
          <span className="statChipLabel">PREPARING</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.ready}</span>
          <span className="statChipLabel">READY</span>
        </div>
        <div className="statChip">
          <span className="statChipValue">{stats.served}</span>
          <span className="statChipLabel">SERVED</span>
        </div>
      </div>

      {/* Pending Approval compact bar */}
      {pendingOrders.length > 0 && can("orders_manage") && (
        <div className="kdsPendingBar">
          <div className="kdsPendingHead">
            <span>⏳ PENDING APPROVAL</span>
            <span className="kdsColBadge">{pendingOrders.length}</span>
          </div>
          <div className="kdsPendingStrips">
            {pendingOrders.map((o) => {
              const id = getOrderId(o);
              const summary = o.items?.map(i => `${i.name} ×${i.qty}`).join(" · ") || "Order";
              return (
                <div key={id} className="kdsPendingStrip">
                  <div className="kdsPendingInfo">
                    <strong className="kdsPendingTable">{o.tableName || o.tableId}</strong>
                    <span className="kdsPendingItems">{summary}</span>
                    <span className="kdsPendingTotal">₹{o.total}</span>
                  </div>
                  <div className="kdsPendingActions">
                    <button className="kdsBtn kdsStart" onClick={() => approveOrder(id)}>Approve →</button>
                    <button className="kdsBtn kdsDelete" onClick={() => declineOrder(id)}>Decline ✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Master-Detail Container */}
      <div className="kdsSplitLayout">
        <div className="kdsColumnsWrapper">
          <div className={`kdsColumns ${newFlash ? "columnFlash" : ""}`}>
            {/* NEW */}
            <div className="kdsColumn">
              <div className="kdsColHeader kdsColHeaderNew">
                <span>NEW</span>
                <span className="kdsColBadge">{newOrders.length}</span>
              </div>
              <div className="kdsColBody">
                <AnimatePresence mode="popLayout">
                  {newOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding: "2rem 0.5rem" }}>
                      <span className="emptyStateIcon">🍳</span>
                      <p className="emptyStateText">No new orders</p>
                    </div>
                  ) : (
                    newOrders.map(o => (
                      <motion.div key={getOrderId(o)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <OrderCard
                          order={o}
                          isActive={selectedOrderId === getOrderId(o)}
                          onClick={() => setSelectedOrderId(getOrderId(o))}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* PREPARING */}
            <div className="kdsColumn">
              <div className="kdsColHeader kdsColHeaderPreparing">
                <span>PREPARING</span>
                <span className="kdsColBadge">{preparingOrders.length}</span>
              </div>
              <div className="kdsColBody">
                <AnimatePresence mode="popLayout">
                  {preparingOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding: "2rem 0.5rem" }}>
                      <span className="emptyStateIcon">⏳</span>
                      <p className="emptyStateText">None preparing</p>
                    </div>
                  ) : (
                    preparingOrders.map(o => (
                      <motion.div key={getOrderId(o)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <OrderCard
                          order={o}
                          isActive={selectedOrderId === getOrderId(o)}
                          onClick={() => setSelectedOrderId(getOrderId(o))}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* READY */}
            <div className="kdsColumn">
              <div className="kdsColHeader kdsColHeaderReady">
                <span>READY</span>
                <span className="kdsColBadge">{readyOrders.length}</span>
              </div>
              <div className="kdsColBody">
                <AnimatePresence mode="popLayout">
                  {readyOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding: "2rem 0.5rem" }}>
                      <span className="emptyStateIcon">✅</span>
                      <p className="emptyStateText">None ready</p>
                    </div>
                  ) : (
                    readyOrders.map(o => (
                      <motion.div key={getOrderId(o)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <OrderCard
                          order={o}
                          isActive={selectedOrderId === getOrderId(o)}
                          onClick={() => setSelectedOrderId(getOrderId(o))}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SERVED */}
            <div className="kdsColumn">
              <div className="kdsColHeader kdsColHeaderServed">
                <span>SERVED</span>
                <span className="kdsColBadge">{servedOrders.length}</span>
              </div>
              <div className="kdsColBody">
                <AnimatePresence mode="popLayout">
                  {servedOrders.length === 0 ? (
                    <div className="emptyState" style={{ padding: "2rem 0.5rem" }}>
                      <span className="emptyStateIcon">🍽️</span>
                      <p className="emptyStateText">None served</p>
                    </div>
                  ) : (
                    servedOrders.map(o => (
                      <motion.div key={getOrderId(o)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <OrderCard
                          order={o}
                          isActive={selectedOrderId === getOrderId(o)}
                          onClick={() => setSelectedOrderId(getOrderId(o))}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="kdsDetailPane">
          <OrderDetail
            order={selectedOrder}
            onStart={handleStart}
            onReady={handleReady}
            onServed={handleServed}
            onDelete={handleDelete}
            can={can}
          />
        </div>
      </div>
    </div>
  );
}