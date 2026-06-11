import { useEffect, useMemo, useRef, useState } from "react";
import "./ManagerDashboard.css";
import { ordersApi, serviceApi } from "../services/api";
import { syncOfflineOrders } from "../services/orderApi";
import { supabase } from "../lib/supabase";

const logOrderAction = async ({ orderId = null, tableId = null, action, performedBy }) => {
  const { error } = await supabase.from("order_logs").insert({
    order_id: orderId,
    table_id: tableId,
    action,
    performed_by: performedBy,
  });

  if (error) {
    console.error("Order log failed:", error);
  }
};

function ManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [newReservationCount, setNewReservationCount] = useState(0);

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

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("order_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setActivityLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const order = orders.find((o) => getOrderId(o) === id);
      const tableId = order?.tableId || order?.tableName || null;

      await ordersApi.updateStatus(id, status);

      if (status === "placed") {
        await supabase
          .from("orders")
          .update({
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);

        await logOrderAction({
          orderId: id,
          tableId,
          action: "ORDER_APPROVED",
          performedBy: "MANAGER",
        });
      }

      if (status === "served") {
        setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));
      }

      await fetchOrders();
      await fetchActivityLogs();
    } catch (err) {
      console.log(err);
      alert("Failed to update order status");
    }
  };

  const rejectOrder = async (id) => {
    if (!id) {
      alert("Order id missing");
      return;
    }

    if (!window.confirm("Reject and delete this order?")) return;

    try {
      const order = orders.find((o) => getOrderId(o) === id);
      const tableId = order?.tableId || order?.tableName || null;

      await logOrderAction({
        orderId: id,
        tableId,
        action: "ORDER_REJECTED",
        performedBy: "MANAGER",
      });

      await supabase
        .from("orders")
        .update({
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id);

      const { error } = await supabase.from("orders").delete().eq("id", id);

      if (error) throw error;

      rejectedOrderIdsRef.current.add(id);

      setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));

      alert("Order rejected successfully");
      await fetchOrders();
      await fetchActivityLogs();
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

      await logOrderAction({
        orderId: id,
        tableId,
        action: "ORDER_DELETED",
        performedBy: "MANAGER",
      });

      await ordersApi.deleteOrder(id);

      setOrders((prev) => prev.filter((order) => getOrderId(order) !== id));

      await fetchOrders();
      await fetchActivityLogs();
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
        await supabase
          .from("service_requests")
          .update({
            acknowledged_at: new Date().toISOString(),
          })
          .eq("id", id);

        await logOrderAction({
          tableId,
          action: "SERVICE_ACKNOWLEDGED",
          performedBy: "MANAGER",
        });
      }

      if (status === "completed") {
        await supabase
          .from("service_requests")
          .update({
            completed_at: new Date().toISOString(),
          })
          .eq("id", id);

        await logOrderAction({
          tableId,
          action: "SERVICE_COMPLETED",
          performedBy: "MANAGER",
        });
      }

      await fetchServiceRequests();
      await fetchActivityLogs();
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
      await fetchActivityLogs();
    };

    loadData();

    const ordersChannel = supabase
      .channel("manager-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    const serviceChannel = supabase
      .channel("manager-service-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests" },
        () => fetchServiceRequests()
      )
      .subscribe();

    const logsChannel = supabase
      .channel("manager-logs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_logs" },
        () => fetchActivityLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(serviceChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(
        (o) => o.status === "pending" || o.status === "pending_approval"
      ).length,
      new: orders.filter((o) => o.status === "new" || o.status === "placed")
        .length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      served: orders.filter((o) => o.status === "served").length,
      servicePending: serviceRequests.filter((r) => r.status === "new").length,
      waiterCalls: serviceRequests.filter(
        (r) => r.status === "new" && r.type === "call_waiter"
      ).length,
      billRequests: serviceRequests.filter(
        (r) => r.status === "new" && r.type === "bill_request"
      ).length,
    };
  }, [orders, serviceRequests]);

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
            className={activeTab === "floor" ? "active" : ""}
            onClick={() => setActiveTab("floor")}
          >
            Floor Plan
          </button>

          <button
            className={activeTab === "waitlist" ? "active" : ""}
            onClick={() => setActiveTab("waitlist")}
          >
            Service Requests ({stats.servicePending})
          </button>

          <button
            className={activeTab === "insights" ? "active" : ""}
            onClick={() => setActiveTab("insights")}
          >
            Insights
          </button>

          <button
            className={activeTab === "activityLogs" ? "active" : ""}
            onClick={() => setActiveTab("activityLogs")}
          >
            Activity Logs
          </button>

          <button
            className={activeTab === "reservations" ? "active" : ""}
            onClick={() => setActiveTab("reservations")}
          >
            Reservations{" "}
            {newReservationCount > 0 && (
              <span className="navBadge">{newReservationCount}</span>
            )}
          </button>
        </nav>
      </aside>

      <section className="managerContent">
        <header className="managerHeader">
          <div>
            <p className="eyebrow">Live Dashboard</p>
            <h1>Manager Dashboard</h1>
            <p>
              Track QR orders, approvals, waiter calls, bill requests, and
              kitchen status in realtime.
            </p>
          </div>

          <button
            className="refreshBtn"
            onClick={() => {
              fetchOrders();
              fetchServiceRequests();
              fetchActivityLogs();
            }}
          >
            Refresh
          </button>
        </header>

        <section className="statsGrid">
          <div className="statCard">
            <h3>{stats.total}</h3>
            <p>Total Orders</p>
          </div>

          <div className="statCard">
            <h3>{stats.pending}</h3>
            <p>Pending Approval</p>
          </div>

          <div className="statCard">
            <h3>{stats.waiterCalls}</h3>
            <p>Waiter Calls</p>
          </div>

          <div className="statCard">
            <h3>{stats.billRequests}</h3>
            <p>Bill Requests</p>
          </div>
        </section>

        {activeTab === "orders" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Orders</h2>
              <span>{orders.length} live orders</span>
            </div>

            {loading ? (
              <p className="emptyBox">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="emptyBox">No orders yet.</p>
            ) : (
              <div className="ordersGrid">
                {orders.map((order) => {
                  const orderId = getOrderId(order);

                  return (
                    <article className="orderCard" key={orderId}>
                      <div className="orderHead">
                        <div>
                          <p className="tableLabel">ORDER FROM</p>
                          <h2 className="tableNumber">
                            {order.tableName ||
                              order.tableId ||
                              "Unknown Table"}
                          </h2>
                          <small>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : "Time not available"}
                          </small>
                        </div>

                        <span className={`statusPill ${order.status || "new"}`}>
                          {order.status ? order.status.toUpperCase() : "NEW"}
                        </span>
                      </div>

                      <div className="orderItems">
                        {order.items?.length === 0 ? (
                          <p>No items found.</p>
                        ) : (
                          order.items?.map((item, index) => (
                            <div className="orderItem" key={index}>
                              <span>
                                {item.name} × {item.qty}
                              </span>
                              <strong>₹{item.price * item.qty}</strong>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="totalRow">
                        <span>Total</span>
                        <strong>₹{order.total}</strong>
                      </div>

                      <div className="orderActions">
                        {order.status === "pending" ||
                        order.status === "pending_approval" ? (
                          <>
                            <button
                              onClick={() => updateStatus(orderId, "placed")}
                            >
                              Approve
                            </button>

                            <button
                              className="rejectBtn"
                              onClick={() => rejectOrder(orderId)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => updateStatus(orderId, "preparing")}
                            >
                              Preparing
                            </button>

                            <button
                              onClick={() => updateStatus(orderId, "ready")}
                            >
                              Ready
                            </button>

                            <button
                              onClick={() => updateStatus(orderId, "served")}
                            >
                              Served
                            </button>

                            <button
                              className="deleteBtn"
                              onClick={() => deleteOrder(orderId)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "floor" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Floor Plan</h2>
              <span>QR table view</span>
            </div>

            <div className="floorGrid">
              {Array.from({ length: 12 }).map((_, index) => {
                const tableNumStr = `Table ${index + 1}`;

                const hasActiveOrder = orders.some(
                  (o) =>
                    o.tableName === tableNumStr &&
                    !["served"].includes(o.status)
                );

                const hasServiceRequest = serviceRequests.some(
                  (r) => r.tableName === tableNumStr && r.status === "new"
                );

                return (
                  <div
                    className={`tableBox ${
                      hasActiveOrder || hasServiceRequest ? "hasOrder" : ""
                    }`}
                    key={index}
                  >
                    <strong>{tableNumStr}</strong>
                    <p>/menu/table-{index + 1}</p>

                    {hasActiveOrder && (
                      <span className="activeOrderText">⚠️ Active Order</span>
                    )}

                    {serviceRequests
                      .filter(
                        (r) => r.tableName === tableNumStr && r.status === "new"
                      )
                      .map((request) => (
                        <span
                          className="activeOrderText"
                          key={getRequestId(request)}
                        >
                          {request.type === "bill_request"
                            ? "🧾 Bill Requested"
                            : "🔔 Waiter Called"}
                        </span>
                      ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "waitlist" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Service Requests</h2>
              <span>{serviceRequests.length} requests</span>
            </div>

            {serviceRequests.length === 0 ? (
              <p className="emptyBox">No service requests yet.</p>
            ) : (
              <div className="ordersGrid">
                {serviceRequests.map((request) => {
                  const requestId = getRequestId(request);

                  return (
                    <article className="orderCard" key={requestId}>
                      <div className="orderHead">
                        <div>
                          <p className="tableLabel">SERVICE REQUEST</p>
                          <h2 className="tableNumber">
                            {request.tableName || request.tableId}
                          </h2>
                          <small>
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleString()
                              : "Time not available"}
                          </small>
                        </div>

                        <span className={`statusPill ${request.status}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="orderItems">
                        <div className="orderItem">
                          <span>Request Type</span>
                          <strong>{getServiceRequestLabel(request.type)}</strong>
                        </div>
                      </div>

                      <div className="orderActions">
                        <button
                          onClick={() =>
                            updateServiceStatus(requestId, "acknowledged")
                          }
                        >
                          Acknowledge
                        </button>

                        <button
                          onClick={() =>
                            updateServiceStatus(requestId, "completed")
                          }
                        >
                          Completed
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "insights" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Insights & Analytics</h2>
              <span>Today</span>
            </div>

            <div className="insightGrid">
              <div>
                <h3>₹{orders.reduce((s, o) => s + (o.total || 0), 0)}</h3>
                <p>Total Revenue</p>
              </div>

              <div>
                <h3>{stats.pending}</h3>
                <p>Pending Approvals</p>
              </div>

              <div>
                <h3>{stats.servicePending}</h3>
                <p>Pending Service Requests</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "activityLogs" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Activity Logs</h2>
              <span>{activityLogs.length} recent actions</span>
            </div>

            {activityLogs.length === 0 ? (
              <p className="emptyBox">No activity logs yet.</p>
            ) : (
              <div className="ordersGrid">
                {activityLogs.map((log) => (
                  <article className="orderCard" key={log.id}>
                    <div className="orderHead">
                      <div>
                        <p className="tableLabel">ACTION</p>
                        <h2 className="tableNumber">{log.action}</h2>
                        <small>
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString("en-IN")
                            : "Time not available"}
                        </small>
                      </div>

                      <span className="statusPill new">
                        {log.performed_by}
                      </span>
                    </div>

                    <div className="orderItems">
                      <div className="orderItem">
                        <span>Table</span>
                        <strong>{log.table_id || "N/A"}</strong>
                      </div>

                      <div className="orderItem">
                        <span>Order ID</span>
                        <strong>{log.order_id || "N/A"}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "reservations" && (
          <ReservationsTab onNewCount={setNewReservationCount} />
        )}
      </section>
    </main>
  );
}

const ReservationsTab = ({ onNewCount }) => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchReservations = async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setReservations(data);
      if (error) console.error("Error fetching reservations:", error);
    };

    fetchReservations();

    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          setReservations((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations" },
        (payload) => {
          setReservations((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const newCount = reservations.filter((r) => r.stage === "new").length;
    onNewCount(newCount);
  }, [reservations, onNewCount]);

  return null;
};

export default ManagerDashboard;