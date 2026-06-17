import { useState, useEffect, useCallback } from "react";
import { eventsApi, bookingsApi } from "../../services/eventsApi";
import { useAuth } from "../../context/AuthContext";
import "./EventsManager.css";

// ─── EMPTY EVENT TEMPLATE ────────────────────────────────────────────────────
const emptyEvent = () => ({
  title: "",
  tagline: "",
  event_date: "",
  background_image_url: "",
  qr_image_url: "",
  upi_id: "",
  vip_whatsapp: "",
  max_tickets: 20,
  is_published: false,
  ticket_types: [
    { id: "girls", label: "Girls", price: 549 },
    { id: "boys", label: "Boys", price: 649 },
    { id: "couples", label: "Couples", price: 1199 },
  ],
  vip_packages: [],
});

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", cls: "statusPending" },
    confirmed: { label: "Confirmed", cls: "statusConfirmed" },
    rejected: { label: "Rejected", cls: "statusRejected" },
  };
  const s = map[status] || map.pending;
  return <span className={`evtStatusBadge ${s.cls}`}>{s.label}</span>;
}

// ─── TICKET TYPE ROW ─────────────────────────────────────────────────────────
function TicketTypeRow({ type, index, onChange, onRemove }) {
  return (
    <div className="evtTicketRow">
      <input
        className="evtInput evtInputSm"
        placeholder="Label (e.g. Girls)"
        value={type.label}
        onChange={(e) => onChange(index, "label", e.target.value)}
      />
      <input
        className="evtInput evtInputSm"
        type="number"
        placeholder="Price ₹"
        value={type.price}
        onChange={(e) => onChange(index, "price", Number(e.target.value))}
      />
      <button className="evtBtnRemove" onClick={() => onRemove(index)}>✕</button>
    </div>
  );
}

// ─── VIP PACKAGE ROW ─────────────────────────────────────────────────────────
function VipPackageRow({ pkg, index, onChange, onRemove }) {
  return (
    <div className="evtVipRow">
      <div className="evtVipRowTop">
        <input
          className="evtInput evtInputSm"
          placeholder="Package name"
          value={pkg.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
        />
        <input
          className="evtInput evtInputSm"
          type="number"
          placeholder="Price ₹"
          value={pkg.price}
          onChange={(e) => onChange(index, "price", Number(e.target.value))}
        />
        <input
          className="evtInput evtInputSm"
          type="number"
          placeholder="Pax"
          value={pkg.pax}
          onChange={(e) => onChange(index, "pax", Number(e.target.value))}
        />
        <button className="evtBtnRemove" onClick={() => onRemove(index)}>✕</button>
      </div>
      <textarea
        className="evtInput evtTextarea"
        placeholder="Features (one per line)"
        value={(pkg.features || []).join("\n")}
        onChange={(e) => onChange(index, "features", e.target.value.split("\n"))}
        rows={3}
      />
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function EventsManager() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Panel state: "list" | "form" | "bookings"
  const [panel, setPanel] = useState("list");
  const [editingEvent, setEditingEvent] = useState(null); // null = new
  const [form, setForm] = useState(emptyEvent());

  // Bookings state
  const [selectedEventForBookings, setSelectedEventForBookings] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStats, setBookingStats] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── FETCH EVENTS ───────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventsApi.getAll();
      setEvents(res.data);
    } catch (e) {
      setError("Failed to load events: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ─── FORM FIELD HELPERS ─────────────────────────────────────────────────────
  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const updateTicketType = (index, key, val) => {
    setForm((prev) => {
      const arr = [...prev.ticket_types];
      arr[index] = { ...arr[index], [key]: val };
      return { ...prev, ticket_types: arr };
    });
  };

  const removeTicketType = (index) => {
    setForm((prev) => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index),
    }));
  };

  const addTicketType = () => {
    setForm((prev) => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { id: `type_${Date.now()}`, label: "", price: 0 }],
    }));
  };

  const updateVipPackage = (index, key, val) => {
    setForm((prev) => {
      const arr = [...prev.vip_packages];
      arr[index] = { ...arr[index], [key]: val };
      return { ...prev, vip_packages: arr };
    });
  };

  const removeVipPackage = (index) => {
    setForm((prev) => ({
      ...prev,
      vip_packages: prev.vip_packages.filter((_, i) => i !== index),
    }));
  };

  const addVipPackage = () => {
    setForm((prev) => ({
      ...prev,
      vip_packages: [
        ...prev.vip_packages,
        { id: `vip_${Date.now()}`, name: "", price: 0, pax: 2, features: [] },
      ],
    }));
  };

  // ─── OPEN CREATE FORM ───────────────────────────────────────────────────────
  const handleNew = () => {
    setEditingEvent(null);
    setForm(emptyEvent());
    setError("");
    setSuccess("");
    setPanel("form");
  };

  // ─── OPEN EDIT FORM ─────────────────────────────────────────────────────────
  const handleEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || "",
      tagline: event.tagline || "",
      event_date: event.event_date || "",
      background_image_url: event.background_image_url || "",
      qr_image_url: event.qr_image_url || "",
      upi_id: event.upi_id || "",
      vip_whatsapp: event.vip_whatsapp || "",
      max_tickets: event.max_tickets || 20,
      is_published: event.is_published || false,
      ticket_types: event.ticket_types || [],
      vip_packages: event.vip_packages || [],
    });
    setError("");
    setSuccess("");
    setPanel("form");
  };

  // ─── SAVE FORM ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setError("Event title is required."); return; }
    setSaving(true);
    setError("");
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, form);
        setSuccess("Event updated successfully!");
      } else {
        await eventsApi.create(form);
        setSuccess("Event created successfully!");
      }
      await fetchEvents();
      setTimeout(() => { setPanel("list"); setSuccess(""); }, 1200);
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await eventsApi.delete(id);
      await fetchEvents();
    } catch (e) {
      setError("Delete failed: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── TOGGLE PUBLISH ─────────────────────────────────────────────────────────
  const handleTogglePublish = async (event) => {
    try {
      await eventsApi.togglePublish(event.id, event.is_published);
      await fetchEvents();
    } catch (e) {
      setError("Failed to update publish status: " + e.message);
    }
  };

  // ─── VIEW BOOKINGS ──────────────────────────────────────────────────────────
  const handleViewBookings = async (event) => {
    setSelectedEventForBookings(event);
    setBookingsLoading(true);
    setPanel("bookings");
    try {
      const [bRes, sRes] = await Promise.all([
        bookingsApi.getByEvent(event.id),
        bookingsApi.getStats(event.id),
      ]);
      setBookings(bRes.data);
      setBookingStats(sRes.data);
    } catch (e) {
      setError("Failed to load bookings: " + e.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await bookingsApi.updateStatus(id, status);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } catch (e) {
      setError("Failed to update booking: " + e.message);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="evtManager">
      <div className="evtHeader">
        <div>
          <h1 className="evtTitle">Events CMS</h1>
          <p className="evtSub">Manage upcoming events, ticket types, and bookings</p>
        </div>
        {panel === "list" && (
          <button className="evtBtnPrimary" onClick={handleNew}>
            + New Event
          </button>
        )}
        {panel !== "list" && (
          <button className="evtBtnSecondary" onClick={() => { setPanel("list"); setError(""); setSuccess(""); }}>
            ← Back to Events
          </button>
        )}
      </div>

      {error && <div className="evtError">{error}</div>}
      {success && <div className="evtSuccess">{success}</div>}

      {/* ── EVENT LIST PANEL ─────────────────────────────────────────────── */}
      {panel === "list" && (
        <div className="evtList">
          {loading ? (
            <div className="evtLoading">
              {[1, 2, 3].map((i) => <div key={i} className="evtSkeleton" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="evtEmptyState">
              <p className="evtEmptyIcon">🎪</p>
              <p className="evtEmptyTitle">No events yet</p>
              <p className="evtEmptySub">Create your first event to get started</p>
              <button className="evtBtnPrimary" onClick={handleNew}>Create Event</button>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`evtCard ${event.is_published ? "published-card" : ""}`}
                style={event.background_image_url ? {
                  backgroundImage: `linear-gradient(135deg, rgba(26,14,8,0.92) 0%, rgba(44,26,14,0.80) 100%), url(${event.background_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                } : {}}
              >
                <div className="evtCardLeft">
                  <div className="evtCardMeta">
                    <span className={`evtPublishBadge ${event.is_published ? "published" : "draft"}`}>
                      {event.is_published ? "● Published" : "○ Draft"}
                    </span>
                    {event.event_date && (
                      <span className="evtCardDate">{event.event_date}</span>
                    )}
                  </div>
                  <h2 className="evtCardTitle">{event.title}</h2>
                  {event.tagline && <p className="evtCardTagline">{event.tagline}</p>}
                  <div className="evtCardInfo">
                    <span>🎫 {(event.ticket_types || []).length} ticket types</span>
                    <span>✦ {(event.vip_packages || []).length} VIP packages</span>
                    <span>🎟️ Max {event.max_tickets} tickets</span>
                  </div>
                </div>
                <div className="evtCardActions">
                  <button
                    className={`evtBtnToggle ${event.is_published ? "unpublish" : "publish"}`}
                    onClick={() => handleTogglePublish(event)}
                  >
                    {event.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button className="evtBtnSecondary evtBtnSm" onClick={() => handleViewBookings(event)}>
                    Bookings
                  </button>
                  <button className="evtBtnSecondary evtBtnSm" onClick={() => handleEdit(event)}>
                    Edit
                  </button>
                  <button
                    className="evtBtnDanger evtBtnSm"
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                  >
                    {deletingId === event.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CREATE / EDIT FORM ───────────────────────────────────────────── */}
      {panel === "form" && (
        <div className="evtForm">
          <h2 className="evtFormTitle">{editingEvent ? "Edit Event" : "Create New Event"}</h2>

          {/* Basic Info */}
          <div className="evtSection">
            <p className="evtSectionLabel">EVENT DETAILS</p>
            <div className="evtGrid2">
              <div className="evtFormGroup">
                <label className="evtLabel">Event Title *</label>
                <input className="evtInput" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Arabian Night" />
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">Event Date</label>
                <input className="evtInput" value={form.event_date} onChange={(e) => setField("event_date", e.target.value)} placeholder="e.g. Saturday, June 2026" />
              </div>
            </div>
            <div className="evtFormGroup">
              <label className="evtLabel">Tagline</label>
              <input className="evtInput" value={form.tagline} onChange={(e) => setField("tagline", e.target.value)} placeholder="e.g. An unforgettable evening of mystique, music & indulgence" />
            </div>
            <div className="evtFormGroup">
              <label className="evtLabel">Max Tickets</label>
              <input className="evtInput evtInputSm" type="number" value={form.max_tickets} onChange={(e) => setField("max_tickets", Number(e.target.value))} />
            </div>
          </div>

          {/* Background Image */}
          <div className="evtSection">
            <p className="evtSectionLabel">VISUAL</p>
            <div className="evtFormGroup">
              <label className="evtLabel">Background Image URL</label>
              <input className="evtInput" value={form.background_image_url} onChange={(e) => setField("background_image_url", e.target.value)} placeholder="https://..." />
            </div>
            {form.background_image_url && (
              <div className="evtImagePreview" style={{ backgroundImage: `url(${form.background_image_url})` }}>
                <span className="evtImagePreviewLabel">Preview</span>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="evtSection">
            <p className="evtSectionLabel">PAYMENT</p>
            <div className="evtGrid2">
              <div className="evtFormGroup">
                <label className="evtLabel">UPI ID</label>
                <input className="evtInput" value={form.upi_id} onChange={(e) => setField("upi_id", e.target.value)} placeholder="yourupi@bank" />
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">QR Image URL</label>
                <input className="evtInput" value={form.qr_image_url} onChange={(e) => setField("qr_image_url", e.target.value)} placeholder="https://... or /qr-image.png" />
              </div>
            </div>
            <div className="evtFormGroup">
              <label className="evtLabel">VIP WhatsApp Number</label>
              <input className="evtInput" value={form.vip_whatsapp} onChange={(e) => setField("vip_whatsapp", e.target.value)} placeholder="919876543210 (with country code, no +)" />
            </div>
          </div>

          {/* Ticket Types */}
          <div className="evtSection">
            <div className="evtSectionHeader">
              <p className="evtSectionLabel">TICKET TYPES</p>
              <button className="evtBtnAdd" onClick={addTicketType}>+ Add Type</button>
            </div>
            {form.ticket_types.length === 0 && (
              <p className="evtHint">No ticket types. Click + Add Type to add one.</p>
            )}
            {form.ticket_types.map((type, i) => (
              <TicketTypeRow key={i} type={type} index={i} onChange={updateTicketType} onRemove={removeTicketType} />
            ))}
          </div>

          {/* VIP Packages */}
          <div className="evtSection">
            <div className="evtSectionHeader">
              <p className="evtSectionLabel">VIP PACKAGES</p>
              <button className="evtBtnAdd" onClick={addVipPackage}>+ Add Package</button>
            </div>
            {form.vip_packages.length === 0 && (
              <p className="evtHint">No VIP packages. Click + Add Package to add one.</p>
            )}
            {form.vip_packages.map((pkg, i) => (
              <VipPackageRow key={i} pkg={pkg} index={i} onChange={updateVipPackage} onRemove={removeVipPackage} />
            ))}
          </div>

          {/* Publish Toggle */}
          <div className="evtSection">
            <div className="evtPublishRow">
              <div>
                <p className="evtSectionLabel">VISIBILITY</p>
                <p className="evtHint">{form.is_published ? "This event is live and visible on the website." : "This event is a draft and hidden from the website."}</p>
              </div>
              <div
                className={`evtToggleWrap ${form.is_published ? "active" : ""}`}
                onClick={() => setField("is_published", !form.is_published)}
              >
                <div className="evtToggleTrack">
                  <div className="evtToggleThumb" />
                </div>
                <span className="evtToggleLabel">{form.is_published ? "Published" : "Draft"}</span>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="evtFormActions">
            <button className="evtBtnSecondary" onClick={() => { setPanel("list"); setError(""); }}>
              Cancel
            </button>
            <button className="evtBtnPrimary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingEvent ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </div>
      )}

      {/* ── BOOKINGS PANEL ───────────────────────────────────────────────── */}
      {panel === "bookings" && selectedEventForBookings && (
        <div className="evtBookings">
          <h2 className="evtFormTitle">Bookings — {selectedEventForBookings.title}</h2>

          {/* Stats Row */}
          {!bookingsLoading && (
            <div className="evtBookingStats">
              <div className="evtStatChip"><span className="evtStatVal">{bookingStats.total || 0}</span><span className="evtStatKey">Total Tickets</span></div>
              <div className="evtStatChip confirmed"><span className="evtStatVal">{bookingStats.confirmed || 0}</span><span className="evtStatKey">Confirmed</span></div>
              <div className="evtStatChip pending"><span className="evtStatVal">{bookingStats.pending || 0}</span><span className="evtStatKey">Pending</span></div>
              <div className="evtStatChip rejected"><span className="evtStatVal">{bookingStats.rejected || 0}</span><span className="evtStatKey">Rejected</span></div>
            </div>
          )}

          {bookingsLoading ? (
            <div className="evtLoading">{[1, 2, 3].map((i) => <div key={i} className="evtSkeleton" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="evtEmptyState">
              <p className="evtEmptyIcon">🎟️</p>
              <p className="evtEmptyTitle">No bookings yet</p>
              <p className="evtEmptySub">Bookings from the website will appear here</p>
            </div>
          ) : (
            <div className="evtBookingTable">
              <div className="evtBookingTableHead">
                <span>Guest</span>
                <span>Contact</span>
                <span>Tickets</span>
                <span>Amount</span>
                <span>Ref</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {bookings.map((b) => (
                <div key={b.id} className="evtBookingRow">
                  <span className="evtBookingName">{b.name}</span>
                  <span className="evtBookingContact">
                    <span>{b.email}</span>
                    <span>{b.phone}</span>
                  </span>
                  <span>{b.quantity}× {b.ticket_type}</span>
                  <span>₹{(b.total_amount || 0).toLocaleString()}</span>
                  <span className="evtBookingRef">{b.booking_ref}</span>
                  <span><StatusBadge status={b.status} /></span>
                  <span className="evtBookingActionBtns">
                    {b.status !== "confirmed" && (
                      <button className="evtBtnConfirm" onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}>✓</button>
                    )}
                    {b.status !== "rejected" && (
                      <button className="evtBtnReject" onClick={() => handleUpdateBookingStatus(b.id, "rejected")}>✕</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
