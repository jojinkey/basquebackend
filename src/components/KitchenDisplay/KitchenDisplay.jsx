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

const logOrderAction = async ({
  orderId = null,
  tableId = null,
  action,
  performedBy,
}) => {
  const { error } = await supabase.from("order_logs").insert({
    order_id: orderId,
    table_id: tableId,
    action,
    performed_by: performedBy,
  });

  if (error) {
    console.error("Kitchen log failed:", error);
  }
};

function useOrderTimer(createdAt) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!createdAt) {
        setMins(0);
        return;
      }

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
  let cls = "timerBadge";

  if (mins >= 20) cls += " timerUrgent";
  else if (mins >= 10) cls += " timerWarn";

  return <span className={cls}>{mins}m</span>;
}

function OrderCard({ order, onStart, onReady, onServed, onDelete, can }) {
  const [updating, setUpdating] = useState(false);
  const orderId = getOrderId(order);

  const runAction = async (fn) => {
    setUpdating(true);

    try {
      await fn();
    } catch (e) {
      console.error("Kitchen action failed:", e);
      alert(e?.message || "Failed to update order");
    } finally {
      setUpdating(false);
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

          <h3 className="kdsTableId">
            {order.tableName || order.tableId || "Unknown Table"}
          </h3>

          <p className="kdsTime">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Time not available"}
          </p>
        </div>

        <TimerBadge createdAt={order.createdAt} />
      </div>

      <div className="kdsItems">
        {order.items?.length ? (
          order.items.map((item, i) => (
            <div key={i} className="kdsItem">
              <span className="kdsItemName">{item.name}</span>
              <span className="kdsItemQty">×{item.qty}</span>
              <span className="kdsItemPrice">₹{item.price * item.qty}</span>
            </div>
          ))
        ) : (
          <p className="emptyStateText">No items found.</p>
        )}
      </div>

      <div className="kdsCardFoot">
        <span className="kdsTotalLabel">₹{order.total}</span>

        <div className="kdsActions">
          {(order.status === "new" || order.status === "placed") &&
            can("kitchen_manage") && (
              <button
                className="kdsBtn kdsStart"
                onClick={() => runAction(() => onStart(orderId))}
                disabled={updating}
              >
                Start →
              </button>
            )}

          {order.status === "preparing" && can("kitchen_manage") && (
            <button
              className="kdsBtn kdsReady"
              onClick={() => runAction(() => onReady(orderId))}
              disabled={updating}
            >
              Ready →
            </button>
          )}

          {order.status === "ready" && can("kitchen_manage") && (
            <button
              className="kdsBtn kdsReady"
              onClick={() => runAction(() => onServed(orderId))}
              disabled={updating}
            >
              Served →
            </button>
          )}

          {order.status === "served" && (
            <span className="kdsServedTag">✓ Served</span>
          )}

          {can("orders_manage") && order.status !== "served" && (
            <button
              className="kdsBtn kdsDelete"
              onClick={() => runAction(() => onDelete(orderId))}
              disabled={updating}
            >
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
  const [startedIds, setStartedIds] = useState(getStartedIds);
  const [loading, setLoading] = useState(true);
  const [newFlash, setNewFlash] = useState(false);

  const getTableIdByOrderId = useCallback(
    (id) => {
      const order = orders.find((o) => getOrderId(o) === id);
      return order?.tableId || order?.tableName || null;
    },
    [orders]
  );

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

  const shapeKitchenOrders = useCallback(
    (rows) => {
      return (rows || []).map((order) => {
        const id = getOrderId(order);

        if (
          startedIds.includes(id) &&
          (order.status === "new" || order.status === "placed")
        ) {
          return { ...order, status: "preparing" };
        }

        return order;
      });
    },
    [startedIds]
  );

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
          setNewFlash(true);
          setTimeout(() => setNewFlash(false), 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  useEffect(() => {
    setOrders((prev) => shapeKitchenOrders(prev));
  }, [startedIds, shapeKitchenOrders]);

  const handleStart = async (id) => {
    const tableId = getTableIdByOrderId(id);

    markStarted(id);

    await supabase
      .from("orders")
      .update({
        kitchen_started_at: new Date().toISOString(),
      })
      .eq("id", id);

    await logOrderAction({
      orderId: id,
      tableId,
      action: "KITCHEN_STARTED",
      performedBy: "KITCHEN",
    });

    setOrders((prev) =>
      prev.map((order) =>
        getOrderId(order) === id ? { ...order, status: "preparing" } : order
      )
    );
  };

  const handleReady = async (id) => {
    const tableId = getTableIdByOrderId(id);

    await ordersApi.updateStatus(id, "ready");

    await supabase
      .from("orders")
      .update({
        ready_at: new Date().toISOString(),
      })
      .eq("id", id);

    await logOrderAction({
      orderId: id,
      tableId,
      action: "ORDER_READY",
      performedBy: "KITCHEN",
    });

    unmarkStarted(id);

    setOrders((prev) =>
      prev.map((order) =>
        getOrderId(order) === id ? { ...order, status: "ready" } : order
      )
    );

    await fetchOrders();
  };

  const handleServed = async (id) => {
    const tableId = getTableIdByOrderId(id);

    await ordersApi.updateStatus(id, "served");

    await supabase
      .from("orders")
      .update({
        served_at: new Date().toISOString(),
      })
      .eq("id", id);

    await logOrderAction({
      orderId: id,
      tableId,
      action: "ORDER_SERVED",
      performedBy: "KITCHEN",
    });

    unmarkStarted(id);

    setOrders((prev) =>
      prev.map((order) =>
        getOrderId(order) === id ? { ...order, status: "served" } : order
      )
    );

    await fetchOrders();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this order?")) return;

    const tableId = getTableIdByOrderId(id);

    await logOrderAction({
      orderId: id,
      tableId,
      action: "ORDER_DELETED_FROM_KITCHEN",
      performedBy: "KITCHEN",
    });

    await ordersApi.deleteOrder(id);
    unmarkStarted(id);

    setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));
  };

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "pending_approval"
  );

  const newOrders = orders.filter(
    (o) => o.status === "new" || o.status === "placed"
  );

  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served").slice(0, 8);

  const approveOrder = async (id) => {
    try {
      await ordersApi.updateStatus(id, "placed");

      setOrders((prev) =>
        prev.map((o) =>
          getOrderId(o) === id ? { ...o, status: "placed" } : o
        )
      );

      await fetchOrders();
    } catch (e) {
      console.error("Approve failed:", e);
    }
  };

  const declineOrder = async (id) => {
    if (!window.confirm("Decline and remove this order?")) return;

    try {
      const tableId = getTableIdByOrderId(id);

      await logOrderAction({
        orderId: id,
        tableId,
        action: "ORDER_DECLINED_FROM_KITCHEN",
        performedBy: "KITCHEN",
      });

      await ordersApi.deleteOrder(id);
      unmarkStarted(id);
      setOrders((prev) => prev.filter((o) => getOrderId(o) !== id));
    } catch (e) {
      console.error("Decline failed:", e);
    }
  };

  const stats = {
    new: newOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
    served: servedOrders.length,
  };

  if (loading) {
    return (
      <div className="emptyState">
        <p className="emptyStateText">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="kdsPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Kitchen Display</h2>
          <p className="dashPanelSub">
            Live order queue · {orders.length} active orders
          </p>
        </div>

        <button className="btnSecondary" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

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

      {pendingOrders.length > 0 && can("orders_manage") && (
        <div className="kdsPendingBar">
          <div className="kdsPendingHead">
            <span>⏳ PENDING APPROVAL</span>
            <span className="kdsColBadge">{pendingOrders.length}</span>
          </div>

          <div className="kdsPendingCards">
            {pendingOrders.map((o) => {
              const id = getOrderId(o);

              return (
                <div key={id} className="kdsPendingCard">
                  <div>
                    <strong>{o.tableName || o.tableId}</strong>

                    <span className="kdsPendingItems">
                      {o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ") ||
                        "Order"}
                    </span>

                    <span className="kdsPendingTotal">₹{o.total}</span>
                  </div>

                  <div className="kdsPendingActions">
                    <button
                      className="kdsBtn kdsStart"
                      onClick={() => approveOrder(id)}
                    >
                      Approve →
                    </button>

                    <button
                      className="kdsBtn kdsDelete"
                      onClick={() => declineOrder(id)}
                    >
                      Decline ✕
                    </button>
                  </div>
                </div>
              );
            })}
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
            {newOrders.length === 0 ? (
              <div className="emptyState" style={{ padding: "2rem" }}>
                <span className="emptyStateIcon">🍳</span>
                <p className="emptyStateText">No new orders</p>
              </div>
            ) : (
              newOrders.map((o) => (
                <OrderCard
                  key={getOrderId(o)}
                  order={o}
                  can={can}
                  onStart={handleStart}
                  onReady={handleReady}
                  onServed={handleServed}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="kdsColumn">
          <div className="kdsColHeader kdsColHeaderPreparing">
            <span>PREPARING</span>
            <span className="kdsColBadge">{preparingOrders.length}</span>
          </div>

          <AnimatePresence>
            {preparingOrders.length === 0 ? (
              <div className="emptyState" style={{ padding: "2rem" }}>
                <span className="emptyStateIcon">⏳</span>
                <p className="emptyStateText">No orders preparing</p>
              </div>
            ) : (
              preparingOrders.map((o) => (
                <OrderCard
                  key={getOrderId(o)}
                  order={o}
                  can={can}
                  onStart={handleStart}
                  onReady={handleReady}
                  onServed={handleServed}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="kdsColumn">
          <div className="kdsColHeader kdsColHeaderReady">
            <span>READY</span>
            <span className="kdsColBadge">{readyOrders.length}</span>
          </div>

          <AnimatePresence>
            {readyOrders.length === 0 ? (
              <div className="emptyState" style={{ padding: "2rem" }}>
                <span className="emptyStateIcon">✅</span>
                <p className="emptyStateText">No orders ready</p>
              </div>
            ) : (
              readyOrders.map((o) => (
                <OrderCard
                  key={getOrderId(o)}
                  order={o}
                  can={can}
                  onStart={handleStart}
                  onReady={handleReady}
                  onServed={handleServed}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="kdsColumn">
          <div className="kdsColHeader kdsColHeaderServed">
            <span>SERVED</span>
            <span className="kdsColBadge">{servedOrders.length}</span>
          </div>

          <AnimatePresence>
            {servedOrders.length === 0 ? (
              <div className="emptyState" style={{ padding: "2rem" }}>
                <span className="emptyStateIcon">🍽️</span>
                <p className="emptyStateText">No orders served yet</p>
              </div>
            ) : (
              servedOrders.map((o) => (
                <OrderCard
                  key={getOrderId(o)}
                  order={o}
                  can={can}
                  onStart={handleStart}
                  onReady={handleReady}
                  onServed={handleServed}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}