import { useEffect, useMemo, useRef, useState } from "react";
import "./ManagerDashboard.css";
import { ordersApi, serviceApi } from "../services/api";
import { syncOfflineOrders } from "../services/orderApi";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const logOrderAction = async ({ orderId = null, tableId = null, action, performedBy }) => {
  const { error } = await supabase.from("order_logs").insert({
    order_id: orderId,
    table_id: tableId,
    action,
    performed_by: performedBy,
  });
  if (error) console.error("Order log failed:", error);
};

function OrderMasterCard({ order, isActive, onClick }) {
  const itemsSummary = order.items?.length
    ? order.items.map(i => `${i.name} ×${i.qty}`).join(" · ")
    : "No items";

  const statusLabel = {
    pending: "PENDING",
    pending_approval: "PENDING",
    placed: "KITCHEN",
    new: "KITCHEN",
    preparing: "PREPARING",
    ready: "READY",
    served: "SERVED",
  }[order.status] || order.status?.toUpperCase();

  const statusClass = {
    pending: "mgPillPending",
    pending_approval: "mgPillPending",
    placed: "mgPillKitchen",
    new: "mgPillKitchen",
    preparing: "mgPillPreparing",
    ready: "mgPillReady",
  }[order.status] || "";

  const timeString = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <button
      className={`mgMasterCard ${isActive ? "mgCardActive" : ""}`}
      onClick={onClick}
    >
      <div className="mgCardHead">
        <strong className="mgCardTable">{order.tableName || order.tableId || "Table ?"}</strong>
        <span className="mgCardTime">{timeString}</span>
      </div>
      <div className="mgCardBody">
        <span className="mgCardSummary">{itemsSummary}</span>
        <span className={`mgOrderPill ${statusClass}`}>{statusLabel}</span>
      </div>
    </button>
  );
}

function RequestMasterCard({ request, isActive, onClick, getServiceRequestLabel }) {
  const timeString = request.createdAt
    ? new Date(request.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <button
      className={`mgMasterCard ${isActive ? "mgCardActive" : ""}`}
      onClick={onClick}
    >
      <div className="mgCardHead">
        <strong className="mgCardTable">{request.tableName || request.tableId}</strong>
        <span className="mgCardTime">{timeString}</span>
      </div>
      <div className="mgCardBody">
        <span className="mgCardSummary">{getServiceRequestLabel(request.type)}</span>
        <span className={`mgOrderPill ${request.status === "new" ? "mgPillPending" : "mgPillReady"}`}>
          {request.status.toUpperCase()}
        </span>
      </div>
    </button>
  );
}

function OrderDetail({ order, onApprove, onReject }) {
  if (!order) {
    return (
      <div className="mgDetailEmpty">
        <div className="mgDetailEmptyIcon">📋</div>
        <p className="mgDetailEmptyText">Select an order to view details</p>
      </div>
    );
  }

  const orderId = order.id || order._id;
  const isPending = order.status === "pending" || order.status === "pending_approval";

  const statusLabel = {
    pending: "Pending Approval",
    pending_approval: "Pending Approval",
    placed: "Placed in Kitchen",
    new: "Placed in Kitchen",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
  }[order.status] || order.status?.toUpperCase();

  const statusClass = {
    pending: "mgPillPending",
    pending_approval: "mgPillPending",
    placed: "mgPillKitchen",
    new: "mgPillKitchen",
    preparing: "mgPillPreparing",
    ready: "mgPillReady",
  }[order.status] || "";

  return (
    <div className="mgDetailContent">
      <div className="mgDetailHeader">
        <div>
          <span className={`mgOrderPill ${statusClass} mgDetailStatus`}>{statusLabel}</span>
          <h2 className="mgDetailTitle">{order.tableName || order.tableId || "Table ?"}</h2>
        </div>
        {order.createdAt && (
          <span className="mgDetailTime">
            Ordered at {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="mgDetailItemsScroll">
        <div className="mgDetailItemsHeader">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div className="mgDetailItemsList">
          {order.items?.map((item, i) => (
            <div key={i} className="mgDetailItemRow">
              <span className="mgDetailItemName">{item.name}</span>
              <span className="mgDetailItemQty">×{item.qty}</span>
              <span className="mgDetailItemPrice">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="mgDetailTotalRow">
          <span>Total Value</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <div className="mgDetailActions">
        {isPending ? (
          <div className="mgDetailActionGroup">
            <button className="btnPrimary mgLargeActionBtn" onClick={() => onApprove(orderId)}>
              ✓ Approve & Send to Kitchen
            </button>
            <button className="btnDanger mgCancelBtn" onClick={() => onReject(orderId)}>
              ✕ Reject Order
            </button>
          </div>
        ) : (
          <div className="mgStatusBanner">
            ✓ Order approved and active in kitchen queue
          </div>
        )}
      </div>
    </div>
  );
}

function RequestDetail({ request, onUpdateStatus, getServiceRequestLabel }) {
  if (!request) {
    return (
      <div className="mgDetailEmpty">
        <div className="mgDetailEmptyIcon">🛎️</div>
        <p className="mgDetailEmptyText">Select a request to view details</p>
      </div>
    );
  }

  const requestId = request.id || request._id;
  const isNew = request.status === "new";

  return (
    <div className="mgDetailContent">
      <div className="mgDetailHeader">
        <div>
          <span className={`mgOrderPill ${request.status === "new" ? "mgPillPending" : "mgPillReady"} mgDetailStatus`}>
            {request.status.toUpperCase()}
          </span>
          <h2 className="mgDetailTitle">{request.tableName || request.tableId || "Table ?"}</h2>
        </div>
        {request.createdAt && (
          <span className="mgDetailTime">
            Requested {new Date(request.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="mgRequestDetailsBox">
        <div className="mgRequestTypeField">
          <span className="mgRequestTypeLabel">REQUEST TYPE</span>
          <strong className="mgRequestTypeValue">{getServiceRequestLabel(request.type)}</strong>
        </div>
        {request.acknowledged_at && (
          <div className="mgRequestTimeField">
            <span>Acknowledged</span>
            <span>{new Date(request.acknowledged_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        {request.completed_at && (
          <div className="mgRequestTimeField">
            <span>Completed</span>
            <span>{new Date(request.completed_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
      </div>

      <div className="mgDetailActions">
        <div className="mgDetailActionGroup">
          {isNew && (
            <button className="btnPrimary mgLargeActionBtn" onClick={() => onUpdateStatus(requestId, "acknowledged")}>
              ✓ Acknowledge Request
            </button>
          )}
          {request.status !== "completed" && (
            <button className="btnSecondary mgLargeActionBtn" onClick={() => onUpdateStatus(requestId, "completed")}>
              Mark Completed
            </button>
          )}
          {request.status === "completed" && (
            <div className="mgStatusBanner served">
              ✓ Request completed and closed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const { user } = useAuth();

  const getPerformedBy = () => {
    if (user?.role === "restaurant_manager") return "Restaurant Manager";
    if (user?.role === "floor_manager") return "Floor Manager";
    if (user?.role === "owner") return "Owner";
    if (user?.role === "manager") return "Restaurant Manager";
    return user?.role || "Manager";
  };

  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const rejectedOrderIdsRef = useRef(new Set());

  const getOrderId = (order) => order?.id || order?._id;
  const getRequestId = (request) => request?.id || request?._id;

  const fetchOrders = async () => {
    try {
      const res = await ordersApi.getAll();
      setOrders(
        (res.data || []).filter((o) => {
          const id = getOrderId(o);
          return o.status !== "served" && !rejectedOrderIdsRef.current.has(id);
        })
      );
    } catch (err) {
      console.log("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const res = await serviceApi.getAll();
      setServiceRequests(res.data || []);
    } catch (err) {
      console.log("Failed to fetch service requests:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const order = orders.find((o) => getOrderId(o) === id);
      const tableId = order?.tableId || order?.tableName || null;

      await ordersApi.updateStatus(id, status);

      if (status === "placed") {
        await supabase.from("orders").update({ approved_at: new Date().toISOString() }).eq("id", id);
        await logOrderAction({ orderId: id, tableId, action: "ORDER_APPROVED", performedBy: getPerformedBy() });
      }

      if (status === "served") {
        setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));
      }

      await fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Failed to update order status");
    }
  };

  const rejectOrder = async (id) => {
    if (!id) { alert("Order id missing"); return; }
    if (!window.confirm("Reject and delete this order?")) return;

    try {
      const order = orders.find((o) => getOrderId(o) === id);
      const tableId = order?.tableId || order?.tableName || null;

      await logOrderAction({ orderId: id, tableId, action: "ORDER_REJECTED", performedBy: getPerformedBy() });
      await supabase.from("orders").update({ rejected_at: new Date().toISOString() }).eq("id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;

      rejectedOrderIdsRef.current.add(id);
      setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));
      if (selectedOrderId === id) {
        setSelectedOrderId(null);
      }
      alert("Order rejected successfully");
      await fetchOrders();
    } catch (err) {
      console.error("Reject order failed:", err);
      alert(err?.message || "Failed to reject order");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      const order = orders.find((o) => getOrderId(o) === id);
      const tableId = order?.tableId || order?.tableName || null;
      await logOrderAction({ orderId: id, tableId, action: "ORDER_DELETED", performedBy: getPerformedBy() });
      await ordersApi.deleteOrder(id);
      setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));
      if (selectedOrderId === id) {
        setSelectedOrderId(null);
      }
      await fetchOrders();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete order");
    }
  };

  const updateServiceStatus = async (id, status) => {
    try {
      const request = serviceRequests.find((r) => getRequestId(r) === id);
      const tableId = request?.tableId || request?.tableName || null;

      await serviceApi.updateStatus(id, status);

      if (status === "acknowledged") {
        await supabase.from("service_requests").update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
        await logOrderAction({ tableId, action: "SERVICE_ACKNOWLEDGED", performedBy: getPerformedBy() });
      }
      if (status === "completed") {
        await supabase.from("service_requests").update({ completed_at: new Date().toISOString() }).eq("id", id);
        await logOrderAction({ tableId, action: "SERVICE_COMPLETED", performedBy: getPerformedBy() });
      }

      await fetchServiceRequests();
    } catch (err) {
      console.log(err);
      alert("Failed to update service request");
    }
  };

  const getServiceRequestLabel = (type) => {
    if (type === "call_waiter") return "Call Waiter";
    if (type === "bill_request") return "Bill Request";
    return type || "Service Request";
  };

  useEffect(() => {
    const loadData = async () => {
      await syncOfflineOrders();
      await fetchOrders();
      await fetchServiceRequests();
    };
    loadData();

    const ordersChannel = supabase
      .channel("manager-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    const serviceChannel = supabase
      .channel("manager-service-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => fetchServiceRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(serviceChannel);
    };
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "pending_approval").length,
    new: orders.filter(o => o.status === "new" || o.status === "placed").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    served: orders.filter(o => o.status === "served").length,
    servicePending: serviceRequests.filter(r => r.status === "new").length,
    waiterCalls: serviceRequests.filter(r => r.status === "new" && r.type === "call_waiter").length,
    billRequests: serviceRequests.filter(r => r.status === "new" && r.type === "bill_request").length,
  }), [orders, serviceRequests]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === "pending" || o.status === "pending_approval"), [orders]);
  const preparingOrders = useMemo(() => orders.filter(o => o.status === "preparing"), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === "ready"), [orders]);

  // Auto-select first order when orders list or active tab changes
  useEffect(() => {
    const activeQueue = [...pendingOrders, ...preparingOrders, ...readyOrders];
    if (activeQueue.length > 0) {
      const exists = activeQueue.some(o => getOrderId(o) === selectedOrderId);
      if (!exists) {
        setSelectedOrderId(getOrderId(activeQueue[0]));
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [orders, selectedOrderId, pendingOrders.length, preparingOrders.length, readyOrders.length]);

  // Auto-select first request when requests list changes
  useEffect(() => {
    if (serviceRequests.length > 0) {
      const exists = serviceRequests.some(r => getRequestId(r) === selectedRequestId);
      if (!exists) {
        setSelectedRequestId(getRequestId(serviceRequests[0]));
      }
    } else {
      setSelectedRequestId(null);
    }
  }, [serviceRequests, selectedRequestId]);

  const selectedOrder = orders.find(o => getOrderId(o) === selectedOrderId);
  const selectedRequest = serviceRequests.find(r => getRequestId(r) === selectedRequestId);

  return (
    <main className="managerPage">
      <aside className="managerSidebar">
        <div>
          <h2 className="brand">Basque</h2>
          <p className="brandSub">Restaurant OS</p>
        </div>

        <nav className="managerNav">
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Orders ({stats.pending})
          </button>
          <button
            className={activeTab === "waitlist" ? "active" : ""}
            onClick={() => setActiveTab("waitlist")}
          >
            Service Requests ({stats.servicePending})
          </button>
        </nav>
      </aside>

      <section className="managerContent">
        {/* Header */}
        <header className="managerHeader">
          <div>
            <p className="eyebrow">Live Dashboard</p>
            <h1>Manager Dashboard</h1>
            <p>Track QR orders, approvals, waiter calls, bill requests, and kitchen status in realtime.</p>
          </div>
          <button className="refreshBtn" onClick={() => { fetchOrders(); fetchServiceRequests(); }}>Refresh</button>
        </header>

        {/* Stats */}
        <section className="statsGrid">
          <div className="statCard">
            <h3>{stats.total}</h3><p>Total Orders</p>
          </div>
          <div className="statCard">
            <h3>{stats.pending}</h3><p>Pending Approval</p>
          </div>
          <div className="statCard">
            <h3>{stats.waiterCalls}</h3><p>Waiter Calls</p>
          </div>
          <div className="statCard">
            <h3>{stats.billRequests}</h3><p>Bill Requests</p>
          </div>
        </section>

        {activeTab === "orders" && (
          <div className="mgSplitLayout">
            {/* Left Column (Master list) */}
            <div className="mgMasterPane">
              {/* ── Pending Approval ── */}
              <div className="mgPanelGroup">
                <div className="mgPanelTop">
                  <h2 className="mgPanelTitle">Pending Approval</h2>
                  <span className="mgPanelCount">{pendingOrders.length} awaiting</span>
                </div>

                {loading ? (
                  <p className="emptyBox">Loading orders...</p>
                ) : pendingOrders.length === 0 ? (
                  <p className="emptyBox">No pending orders</p>
                ) : (
                  <div className="mgOrderList">
                    <AnimatePresence mode="popLayout">
                      {pendingOrders.map(order => (
                        <motion.div
                          key={getOrderId(order)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <OrderMasterCard
                            order={order}
                            isActive={selectedOrderId === getOrderId(order)}
                            onClick={() => setSelectedOrderId(getOrderId(order))}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ── In Kitchen (read-only) ── */}
              <div className="mgPanelGroup" style={{ marginTop: "1.5rem" }}>
                <div className="mgPanelTop">
                  <h2 className="mgPanelTitle">In Kitchen</h2>
                  <span className="mgPanelCount">{preparingOrders.length + readyOrders.length} active</span>
                </div>
                {preparingOrders.length === 0 && readyOrders.length === 0 ? (
                  <p className="emptyBox">No orders in kitchen</p>
                ) : (
                  <div className="mgOrderList">
                    {[...preparingOrders, ...readyOrders].map(order => (
                      <OrderMasterCard
                        key={getOrderId(order)}
                        order={order}
                        isActive={selectedOrderId === getOrderId(order)}
                        onClick={() => setSelectedOrderId(getOrderId(order))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Detail View) */}
            <div className="mgDetailPane">
              <OrderDetail
                order={selectedOrder}
                onApprove={(id) => updateStatus(id, "placed")}
                onReject={rejectOrder}
                onDelete={deleteOrder}
                getPerformedBy={getPerformedBy}
              />
            </div>
          </div>
        )}

        {activeTab === "waitlist" && (
          <div className="mgSplitLayout">
            {/* Left Column (Master list) */}
            <div className="mgMasterPane">
              <div className="mgPanelGroup">
                <div className="mgPanelTop">
                  <h2 className="mgPanelTitle">Service Requests</h2>
                  <span className="mgPanelCount">{serviceRequests.length} active</span>
                </div>

                {serviceRequests.length === 0 ? (
                  <p className="emptyBox">No service requests yet.</p>
                ) : (
                  <div className="mgOrderList">
                    {serviceRequests.map(request => (
                      <RequestMasterCard
                        key={getRequestId(request)}
                        request={request}
                        isActive={selectedRequestId === getRequestId(request)}
                        onClick={() => setSelectedRequestId(getRequestId(request))}
                        getServiceRequestLabel={getServiceRequestLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Detail View) */}
            <div className="mgDetailPane">
              <RequestDetail
                request={selectedRequest}
                onUpdateStatus={updateServiceStatus}
                getServiceRequestLabel={getServiceRequestLabel}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ManagerDashboard;