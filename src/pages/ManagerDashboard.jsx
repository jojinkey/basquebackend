import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ManagerDashboard.css";
import { socket } from "../services/socket";
import { syncOfflineOrders } from "../services/orderApi";
import { supabase } from "../lib/supabase";

const ORDER_API_URL = "http://localhost:5000/api/orders";
const SERVICE_API_URL = "http://localhost:5000/api/service-requests";

function ManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the reservations notification badge
  const [newReservationCount, setNewReservationCount] = useState(0);

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

          {/* NEW: Reservations Tab Button */}
          <button
            className={activeTab === "reservations" ? "active" : ""}
            onClick={() => setActiveTab("reservations")}
          >
            Reservations {newReservationCount > 0 && <span className="navBadge">{newReservationCount}</span>}
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

        {/* NEW: Reservations Tab Render */}
        {activeTab === "reservations" && (
          <ReservationsTab onNewCount={setNewReservationCount} />
        )}
      </section>
    </main>
  );
}

// ─── HELPER FUNCTIONS FOR RESERVATIONS TAB ─────────────────────────────
const getTypeInfo = (sourceModal) => {
  switch (sourceModal) {
    case 'TableBookingModal':  return { label: 'Table',      icon: '🍽️' };
    case 'CourtBookingModal':  return { label: 'Court',      icon: '🏓' };
    case 'GolfBookingModal':   return { label: 'Golf',       icon: '⛳' };
    case 'GolfDiningModal':    return { label: 'Golf+Dining',icon: '🍷' };
    case 'EventEnquiryModal':  return { label: 'Event',      icon: '🎉' };
    default:                   return { label: 'Booking',    icon: '📋' };
  }
};

const getStageBadgeColor = (stage) => {
  const colors = {
    new:                '#2196f3',   // blue
    reviewing:          '#ff9800',   // orange
    accepted:           '#4caf50',   // green
    declined:           '#f44336',   // red
    waitlisted:         '#9c27b0',   // purple
    callback_requested: '#ff5722',   // deep orange
    completed:          '#607d8b',   // grey-blue
    no_show:            '#9e9e9e',   // grey
  };
  return colors[stage] || '#9e9e9e';
};

const getDetailsSummary = (reservation) => {
  const d = reservation.details || {};
  switch (reservation.source_modal) {
    case 'TableBookingModal':
      return d.occasion ? `Occasion: ${d.occasion}` : 'No occasion specified';
    case 'CourtBookingModal':
      return `${d.duration_hours || 1}hr · ${d.equipment || 'No equipment'}`;
    case 'GolfBookingModal':
      return `${d.duration || '1 hr'} · ${d.experience || 'Experience not specified'}`;
    case 'GolfDiningModal':
      const pkgNames = { round: 'The Round', afternoon: 'The Afternoon', corporate: 'Corporate Day' };
      return pkgNames[d.package] || d.package || 'Package not specified';
    case 'EventEnquiryModal':
      return [d.event_type, d.space, d.budget].filter(Boolean).join(' · ') || 'No details';
    default:
      return '—';
  }
};

// ─── NEW: RESERVATIONS TAB COMPONENT ───────────────────────────────────
const ReservationsTab = ({ onNewCount }) => {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchReservations = async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setReservations(data);
      if (error) console.error("Error fetching reservations:", error);
    };

    fetchReservations();

    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload) => {
          setReservations((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations' },
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
    const newCount = reservations.filter(r => r.stage === 'new').length;
    onNewCount(newCount);
  }, [reservations, onNewCount]);

  const updateStage = async (id, newStage) => {
    const { error } = await supabase
      .from('reservations')
      .update({ stage: newStage })
      .eq('id', id);
    if (error) alert('Failed to update stage');
  };

  const filteredReservations = reservations.filter((r) => {
    if (filter === 'All') return true;
    if (filter === 'Tables') return r.source_modal === 'TableBookingModal';
    if (filter === 'Courts') return r.source_modal === 'CourtBookingModal';
    if (filter === 'Golf') return r.source_modal === 'GolfBookingModal';
    if (filter === 'Golf+Dining') return r.source_modal === 'GolfDiningModal';
    if (filter === 'Events') return r.source_modal === 'EventEnquiryModal';
    return true;
  });

  return (
    <section className="dashboardPanel">
      <div className="panelTop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Reservations</h2>
          <span className="liveIndicator">
            <span className="liveDot"></span>
            Live Connection
          </span>
        </div>
      </div>

      <div className="filterBar">
        {['All', 'Tables', 'Courts', 'Golf', 'Golf+Dining', 'Events'].map(f => (
          <button 
            key={f} 
            className={`filterBtn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredReservations.length === 0 ? (
        <div className="resEmptyBox">No reservations found for this filter.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="reservationsTable">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Guests</th>
                <th>Details</th>
                <th>Stage</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res) => {
                const typeInfo = getTypeInfo(res.source_modal);
                return (
                  <tr key={res.id}>
                    <td>
                      <div className="typeCell">
                        <span>{typeInfo.icon}</span> {typeInfo.label}
                      </div>
                    </td>
                    <td><strong>{res.name}</strong></td>
                    <td>{res.phone}</td>
                    <td>{res.date ? new Date(res.date).toLocaleDateString() : 'Flexible'}</td>
                    <td>{res.time_slot || '—'}</td>
                    <td>{res.guests || '—'}</td>
                    <td style={{ color: 'rgba(0,0,0,0.6)' }}>{getDetailsSummary(res)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          className="stageBadge" 
                          style={{ backgroundColor: getStageBadgeColor(res.stage) }}
                        >
                          {res.stage.toUpperCase()}
                        </span>
                        <select
                          className="stageSelect"
                          value={res.stage}
                          onChange={(e) => updateStage(res.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                          <option value="waitlisted">Waitlisted</option>
                          <option value="callback_requested">Callback Requested</option>
                          <option value="completed">Completed</option>
                          <option value="no_show">No Show</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>
                      {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ManagerDashboard;