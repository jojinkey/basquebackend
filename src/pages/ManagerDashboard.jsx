import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ManagerDashboard.css";
import { socket } from "../services/socket";
import { syncOfflineOrders } from "../services/orderApi";

// --- NEW IMPORTS FOR DELIVERY ---
import { getAllDeliveryOrders, updateDeliveryOrderStatus } from "../services/deliveryOrderApi";

const ORDER_API_URL = "http://localhost:5000/api/orders";
const SERVICE_API_URL = "http://localhost:5000/api/service-requests";

function ManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(ORDER_API_URL);
      setOrders(res.data);
    } catch (err) {
      console.log("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const res = await axios.get(SERVICE_API_URL);
      setServiceRequests(res.data);
    } catch (err) {
      console.log("Failed to fetch service requests:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${ORDER_API_URL}/${id}/status`, { status });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteOrder = async (id) => {
    try {
      await axios.delete(`${ORDER_API_URL}/${id}`);
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  const updateServiceStatus = async (id, status) => {
    try {
      await axios.put(`${SERVICE_API_URL}/${id}/status`, { status });
      fetchServiceRequests();
    } catch (err) {
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
      fetchOrders();
      fetchServiceRequests();
    };

    loadData();

    socket.on("order:new", (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((order) => order._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    });

    socket.on("order:updated", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    socket.on("order:deleted", (deletedId) => {
      setOrders((prev) => prev.filter((order) => order._id !== deletedId));
    });

    socket.on("service:new", (newRequest) => {
      setServiceRequests((prev) => {
        const exists = prev.some((request) => request._id === newRequest._id);
        if (exists) return prev;
        return [newRequest, ...prev];
      });

      setActiveTab("waitlist");
      alert(`${getServiceRequestLabel(newRequest.type)} request from ${newRequest.tableName}`);
    });

    socket.on("service:updated", (updatedRequest) => {
      setServiceRequests((prev) =>
        prev.map((request) =>
          request._id === updatedRequest._id ? updatedRequest : request
        )
      );
    });

    return () => {
      socket.off("order:new");
      socket.off("order:updated");
      socket.off("order:deleted");
      socket.off("service:new");
      socket.off("service:updated");
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      new: orders.filter((o) => o.status === "new").length,
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
            Kitchen Orders
          </button>
          
          {/* --- NEW TAB FOR DELIVERY --- */}
          <button
            className={activeTab === "delivery" ? "active" : ""}
            onClick={() => setActiveTab("delivery")}
          >
            Delivery Orders
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
        </nav>
      </aside>

      <section className="managerContent">
        <header className="managerHeader">
          <div>
            <p className="eyebrow">Live Dashboard</p>
            <h1>Manager Dashboard</h1>
            <p>Track QR orders, waiter calls, bill requests, and kitchen status in realtime.</p>
          </div>

          <button
            className="refreshBtn"
            onClick={() => {
              fetchOrders();
              fetchServiceRequests();
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
            <h3>{stats.new}</h3>
            <p>New Orders</p>
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
              <h2>Kitchen Orders</h2>
              <span>{orders.length} live orders</span>
            </div>

            {loading ? (
              <p className="emptyBox">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="emptyBox">No orders yet.</p>
            ) : (
              <div className="ordersGrid">
                {orders.map((order) => (
                  <article className="orderCard" key={order._id}>
                    <div className="orderHead">
                      <div>
                        <p className="tableLabel">ORDER FROM</p>
                        <h2 className="tableNumber">
                          {order.tableName || order.tableId || "Unknown Table"}
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
                      {order.items.map((item, index) => (
                        <div className="orderItem" key={index}>
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <strong>₹{item.price * item.qty}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="totalRow">
                      <span>Total</span>
                      <strong>₹{order.total}</strong>
                    </div>

                    <div className="orderActions">
                      <button onClick={() => updateStatus(order._id, "new")}>
                        New
                      </button>

                      <button
                        onClick={() => updateStatus(order._id, "preparing")}
                      >
                        Preparing
                      </button>

                      <button onClick={() => updateStatus(order._id, "served")}>
                        Served
                      </button>

                      <button
                        className="deleteBtn"
                        onClick={() => deleteOrder(order._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- NEW CONTENT SECTION FOR DELIVERY --- */}
        {activeTab === "delivery" && <DeliveryOrdersTab />}

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
                  (o) => o.tableName === tableNumStr && o.status !== "served"
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
                      <span className="activeOrderText">
                        ⚠️ Active Order In Kitchen
                      </span>
                    )}

                    {serviceRequests
                      .filter(
                        (r) => r.tableName === tableNumStr && r.status === "new"
                      )
                      .map((request) => (
                        <span className="activeOrderText" key={request._id}>
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
                {serviceRequests.map((request) => (
                  <article className="orderCard" key={request._id}>
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
                          updateServiceStatus(request._id, "acknowledged")
                        }
                      >
                        Acknowledge
                      </button>

                      <button
                        onClick={() =>
                          updateServiceStatus(request._id, "completed")
                        }
                      >
                        Completed
                      </button>
                    </div>
                  </article>
                ))}
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
                <h3>₹{orders.reduce((s, o) => s + o.total, 0)}</h3>
                <p>Total Revenue</p>
              </div>

              <div>
                <h3>{stats.new}</h3>
                <p>Pending Orders</p>
              </div>

              <div>
                <h3>{stats.servicePending}</h3>
                <p>Pending Service Requests</p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

// --- NEW SUB-COMPONENT FOR DELIVERY ORDERS TAB ---
const DeliveryOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOrders();

    const handleNewOrder = (order) => setOrders((prev) => [order, ...prev]);
    const handleOrderUpdated = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('deliveryOrder:new', handleNewOrder);
    socket.on('deliveryOrder:updated', handleOrderUpdated);

    return () => {
      socket.off('deliveryOrder:new', handleNewOrder);
      socket.off('deliveryOrder:updated', handleOrderUpdated);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllDeliveryOrders();
      if (data) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch delivery orders');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDeliveryOrderStatus(id, newStatus);
      // Optimistically update the UI status
      setOrders(prev => prev.map(o => o.id === id ? { ...o, orderStatus: newStatus } : o));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getBadgeColor = (status) => {
    const colors = {
      placed: '#9e9e9e',       // grey
      confirmed: '#2196f3',    // blue
      preparing: '#ff9800',    // orange
      dispatched: '#9c27b0',   // purple
      out_for_delivery: 'var(--amber)', // amber
      delivered: '#4caf50',    // green
      cancelled: '#f44336',    // red
      failed: '#f44336'        // red
    };
    return colors[status] || '#9e9e9e';
  };

  return (
    <section className="dashboardPanel" style={{ overflowX: 'auto' }}>
      <div className="panelTop">
        <h2>Delivery Orders</h2>
        <span>{orders.length} delivery orders</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
            <th style={{ padding: '12px' }}>Order ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>AWB</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <React.Fragment key={order.id}>
              <tr 
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{order.clientOrderNumber}</td>
                <td>{order.customerName}</td>
                <td>{order.customerPhone}</td>
                <td>{order.items?.length || 0} items</td>
                <td>₹{order.total}</td>
                <td>
                  <span style={{
                    background: getBadgeColor(order.orderStatus),
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {order.orderStatus?.replace(/_/g, ' ').toUpperCase() || 'PLACED'}
                  </span>
                </td>
                <td>{order.shadowfaxAwb || 'Pending'}</td>
                <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              
              {/* Expandable Details Row */}
              {expandedId === order.id && (
                <tr style={{ background: '#fafafa' }}>
                  <td colSpan="8" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Order Items</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {order.items?.map((item, i) => (
                            <li key={i}>{item.qty}x {item.name} (₹{item.price * item.qty})</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Delivery Details</h4>
                        <p style={{ margin: '0 0 4px 0' }}>{order.deliveryAddress}</p>
                        <p style={{ margin: 0 }}>{order.deliveryCity}, {order.deliveryState} {order.deliveryPincode}</p>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Actions & Tracking</h4>
                        {order.shadowfaxLabelUrl ? (
                          <a href={order.shadowfaxLabelUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', display: 'block', marginBottom: '10px' }}>
                            📄 Print Shipping Label
                          </a>
                        ) : (
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.6 }}>No label generated yet</p>
                        )}
                        <select 
                          value={order.orderStatus} 
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ padding: '6px' }}
                        >
                          <option value="placed">Placed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default ManagerDashboard;