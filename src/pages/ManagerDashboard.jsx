import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ManagerDashboard.css";

const API_URL = "http://localhost:5000/api/orders";

function ManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(API_URL);
      setOrders(res.data);
    } catch (err) {
      console.log("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteOrder = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchOrders();
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      new: orders.filter((o) => o.status === "new").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      served: orders.filter((o) => o.status === "served").length,
    };
  }, [orders]);

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
            Waitlist
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
            <p>Track QR table orders and kitchen status.</p>
          </div>

          <button className="refreshBtn" onClick={fetchOrders}>
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
            <h3>{stats.preparing}</h3>
            <p>Preparing</p>
          </div>
          <div className="statCard">
            <h3>{stats.served}</h3>
            <p>Served</p>
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
                        <p className="tableLabel">ORIGINATING SEATING</p>
                        {/* Highlights the precise table target layout */}
                        <h2 style={{ color: "var(--teak)", fontWeight: "700" }}>
                          {order.tableName || "Digital Menu Overview"}
                        </h2>
                        <small>
                          {new Date(order.createdAt).toLocaleString()}
                        </small>
                      </div>

                      <span className={`statusPill ${order.status}`}>
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
                      <button onClick={() => updateStatus(order._id, "preparing")}>
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

        {activeTab === "floor" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Floor Plan</h2>
              <span>QR table view</span>
            </div>

            <div className="floorGrid">
              {Array.from({ length: 12 }).map((_, index) => {
                const tableNumStr = `Table ${index + 1}`;
                // Check if this table has an unresolved active order open
                const hasActiveOrder = orders.some(
                  (o) => o.tableName === tableNumStr && o.status !== "served"
                );

                return (
                  <div 
                    className={`tableBox ${hasActiveOrder ? "hasOrder" : ""}`} 
                    key={index}
                    style={{
                      border: hasActiveOrder ? "2px solid #e53935" : "1px solid #ccc",
                      background: hasActiveOrder ? "#ffebee" : "transparent",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <strong>{tableNumStr}</strong>
                    <p>/menu/table-{index + 1}</p>
                    {hasActiveOrder && (
                      <span style={{ color: "#d32f2f", fontSize: "11px", fontWeight: "600" }}>
                        ⚠️ Active Order In Kitchen
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "waitlist" && (
          <section className="dashboardPanel">
            <div className="panelTop">
              <h2>Waitlist</h2>
              <span>Coming next</span>
            </div>
            <p className="emptyBox">Waitlist feature can be added next.</p>
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
                <h3>{stats.served}</h3>
                <p>Completed Orders</p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default ManagerDashboard;