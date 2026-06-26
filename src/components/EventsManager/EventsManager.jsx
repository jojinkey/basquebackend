import { useState, useEffect, useCallback, useRef } from "react";
import { eventsApi, bookingsApi } from "../../services/eventsApi";
import { useAuth } from "../../context/AuthContext";
import "./EventsManager.css";

// ─── EMPTY EVENT TEMPLATE ────────────────────────────────────────────────────
const emptyEvent = () => ({
  title: "",
  tagline: "",
  event_date: "",
  start_time: "",
  end_time: "",
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
  custom_styles: {
    title_font: "'Cinzel Decorative', serif",
    title_size: "3.5rem",
    text_color: "#f8ebcb",
    tagline_color: "rgba(248, 235, 203, 0.65)",
    accent_color: "#c8852a",
    overlay_color: "#0a0603",
    overlay_opacity: 0.82
  }
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
  const dateInputRef = useRef(null);
  const bgFileInputRef = useRef(null);
  const qrFileInputRef = useRef(null);
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
  const [isStyleCustomized, setIsStyleCustomized] = useState(false);
  const [detectedVibe, setDetectedVibe] = useState("Basque Classic");

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

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setField(field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const setStyleField = (key, val) => {
    setIsStyleCustomized(true);
    setForm((prev) => ({
      ...prev,
      custom_styles: {
        ...(prev.custom_styles || {}),
        [key]: val,
      },
    }));
  };

  const generateAesthetics = (title, tagline) => {
    const t = (title || "").toLowerCase();
    const tag = (tagline || "").toLowerCase();
    const text = `${t} ${tag}`;

    let vibeName = "Basque Classic";
    let theme = {
      title_font: "'Cinzel Decorative', serif",
      title_size: "3.5rem",
      text_color: "#f8ebcb",
      tagline_color: "rgba(248, 235, 203, 0.65)",
      accent_color: "#c8852a",
      overlay_color: "#0a0603",
      overlay_opacity: 0.82
    };

    if (text.match(/neon|techno|edm|rave|club|dj|trance|electro|house|beats|synth|party|dance/)) {
      vibeName = "🎧 Techno & Neon Rave";
      theme = {
        title_font: "'Outfit', sans-serif",
        title_size: "3.5rem",
        text_color: "#ffffff",
        tagline_color: "rgba(255, 255, 255, 0.7)",
        accent_color: "#ff007f", // Neon Magenta
        overlay_color: "#06020f", // Midnight Violet
        overlay_opacity: 0.80
      };
    } else if (text.match(/sufi|ghazal|classical|mehfil|qawwali|heritage|shaam|traditional|gazal/)) {
      vibeName = "🕌 Sufi & Ghazal Mehfil";
      theme = {
        title_font: "'Cinzel Decorative', serif",
        title_size: "3.5rem",
        text_color: "#fcecd2",
        tagline_color: "rgba(252, 236, 210, 0.65)",
        accent_color: "#d4af37", // Antique Gold
        overlay_color: "#120904", // Mahogany Wood
        overlay_opacity: 0.86
      };
    } else if (text.match(/jazz|acoustic|soul|blues|live|guitar|unplugged|harmony/)) {
      vibeName = "🎷 Jazz & Acoustic Lounge";
      theme = {
        title_font: "'Cormorant Garamond', serif",
        title_size: "3.5rem",
        text_color: "#f7ebd3",
        tagline_color: "rgba(247, 235, 211, 0.65)",
        accent_color: "#c8852a", // Copper Gold
        overlay_color: "#0a0806", // Dark Lounge Charcoal
        overlay_opacity: 0.80
      };
    } else if (text.match(/bollywood|punjabi|desi|beats|dhol|fest|dandiya|holi|diwali/)) {
      vibeName = "🥁 Bollywood & Desi Beats";
      theme = {
        title_font: "'Montserrat', sans-serif",
        title_size: "3.5rem",
        text_color: "#fffbeb",
        tagline_color: "rgba(255, 251, 235, 0.7)",
        accent_color: "#e6005c", // Fuchsia
        overlay_color: "#0f0205", // Deep Ruby Velvet
        overlay_opacity: 0.84
      };
    } else if (text.match(/brunch|sunset|sundowner|day|pool|afternoon|feast|summer/)) {
      vibeName = "🌅 Sunset & Brunch Sundowner";
      theme = {
        title_font: "'Outfit', sans-serif",
        title_size: "3.5rem",
        text_color: "#fff9f0",
        tagline_color: "rgba(255, 249, 240, 0.7)",
        accent_color: "#e07a5f", // Terracotta Orange
        overlay_color: "#1d1512", // Warm Dusk
        overlay_opacity: 0.72
      };
    } else if (text.match(/monsoon|rain|cool|winter|ice|frost|breeze|blue/)) {
      vibeName = "🌧️ Monsoon & Cool Breeze";
      theme = {
        title_font: "'Cormorant Garamond', serif",
        title_size: "3.5rem",
        text_color: "#e3f2fd",
        tagline_color: "rgba(227, 242, 253, 0.7)",
        accent_color: "#80deea", // Cool Ice Blue
        overlay_color: "#050b14", // Deep Ocean
        overlay_opacity: 0.84
      };
    } else if (text.match(/halloween|spooky|horror|dark|ghost|phantom|witch/)) {
      vibeName = "🎃 Halloween & Dark Mystery";
      theme = {
        title_font: "'Cinzel', serif",
        title_size: "3.5rem",
        text_color: "#ffe57f",
        tagline_color: "rgba(255, 229, 127, 0.65)",
        accent_color: "#ff6d00", // Pumpkin Orange
        overlay_color: "#0d0200", // Deep blood-red black
        overlay_opacity: 0.90
      };
    } else {
      // Heuristic 2: Direct Color extraction
      if (text.match(/gold|amber|yellow/)) {
        vibeName = "✨ Warm Gold Theme";
        theme.accent_color = "#d4af37";
        theme.overlay_color = "#0a0603";
      } else if (text.match(/ruby|red|crimson|burgundy/)) {
        vibeName = "🍷 Crimson Velvet Theme";
        theme.accent_color = "#d32f2f";
        theme.overlay_color = "#0c0204";
      } else if (text.match(/emerald|green|forest/)) {
        vibeName = "🌲 Emerald Forest Theme";
        theme.accent_color = "#2e7d32";
        theme.overlay_color = "#020803";
        theme.title_font = "'Cormorant Garamond', serif";
      } else if (text.match(/sapphire|blue|indigo|ocean|aqua/)) {
        vibeName = "🌊 Sapphire Blue Theme";
        theme.accent_color = "#1565c0";
        theme.overlay_color = "#02050f";
        theme.title_font = "'Outfit', sans-serif";
      } else if (text.match(/rose|pink|magenta|fuchsia/)) {
        vibeName = "🌸 Rose Blossom Theme";
        theme.accent_color = "#ec407a";
        theme.overlay_color = "#0d0208";
        theme.title_font = "'Outfit', sans-serif";
      } else if (text.match(/violet|purple|plum/)) {
        vibeName = "🍇 Royal Violet Theme";
        theme.accent_color = "#7b1fa2";
        theme.overlay_color = "#08020d";
      } else if (text.match(/orange|peach|sunset/)) {
        vibeName = "🍊 Sunset Peach Theme";
        theme.accent_color = "#f57c00";
        theme.overlay_color = "#120902";
        theme.title_font = "'Outfit', sans-serif";
      } else if (text.match(/white|silver|platinum/)) {
        vibeName = "❄️ Platinum Silver Theme";
        theme.accent_color = "#cfd8dc";
        theme.overlay_color = "#0b0c10";
        theme.title_font = "'Montserrat', sans-serif";
      }
    }

    return { theme, vibeName };
  };

  const runAestheticsEngine = (title, tagline) => {
    const { theme, vibeName } = generateAesthetics(title, tagline);
    setDetectedVibe(vibeName);
    setForm(prev => ({
      ...prev,
      custom_styles: theme
    }));
  };

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
    setIsStyleCustomized(false);
    setDetectedVibe("Basque Classic");
    setError("");
    setSuccess("");
    setPanel("form");
  };

  // ─── OPEN EDIT FORM ─────────────────────────────────────────────────────────
  const handleEdit = (event) => {
    setEditingEvent(event);
    const defaults = {
      title_font: "'Cinzel Decorative', serif",
      title_size: "3.5rem",
      text_color: "#f8ebcb",
      tagline_color: "rgba(248, 235, 203, 0.65)",
      accent_color: "#c8852a",
      overlay_color: "#0a0603",
      overlay_opacity: 0.82
    };
    setForm({
      title: event.title || "",
      tagline: event.tagline || "",
      event_date: event.event_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      background_image_url: event.background_image_url || "",
      qr_image_url: event.qr_image_url || "",
      upi_id: event.upi_id || "",
      vip_whatsapp: event.vip_whatsapp || "",
      max_tickets: event.max_tickets || 20,
      is_published: event.is_published || false,
      ticket_types: event.ticket_types || [],
      vip_packages: event.vip_packages || [],
      custom_styles: { ...defaults, ...(event.custom_styles || {}) },
    });
    setIsStyleCustomized(true);
    const { vibeName } = generateAesthetics(event.title, event.tagline);
    setDetectedVibe(vibeName);
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
                  {(event.start_time || event.end_time) && (
                    <div className="evtCardTimeDisplay" style={{ fontSize: "0.82rem", opacity: 0.8, color: "var(--teak-dim)", marginBottom: "6px", fontFamily: "var(--font-body)" }}>
                      🕒 {event.start_time || "N/A"} - {event.end_time || "N/A"}
                    </div>
                  )}
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
                <input 
                  className="evtInput" 
                  value={form.title} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setField("title", val);
                    if (!editingEvent && !isStyleCustomized) {
                      runAestheticsEngine(val, form.tagline);
                    }
                  }} 
                  placeholder="e.g. Arabian Night" 
                />
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">Event Date</label>
                <div className="evtDateInputWrapper">
                  <input
                    className="evtInput"
                    value={form.event_date}
                    onChange={(e) => setField("event_date", e.target.value)}
                    placeholder="e.g. Saturday, June 2026"
                  />
                  <button
                    type="button"
                    className="evtCalendarBtn"
                    onClick={() => {
                      if (dateInputRef.current) {
                        if (typeof dateInputRef.current.showPicker === 'function') {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.click();
                        }
                      }
                    }}
                    title="Select from Calendar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="0" ry="0"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </button>
                  <input
                    type="date"
                    ref={dateInputRef}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    onChange={(e) => {
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        const formatted = d.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                        setField("event_date", formatted);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="evtGrid2" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="evtFormGroup">
                <label className="evtLabel">Start Time</label>
                <input className="evtInput" value={form.start_time || ""} onChange={(e) => setField("start_time", e.target.value)} placeholder="e.g. 8:00 PM" />
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">End Time</label>
                <input className="evtInput" value={form.end_time || ""} onChange={(e) => setField("end_time", e.target.value)} placeholder="e.g. 1:00 AM" />
              </div>
            </div>
            <div className="evtFormGroup">
              <label className="evtLabel">Tagline</label>
              <input 
                className="evtInput" 
                value={form.tagline} 
                onChange={(e) => {
                  const val = e.target.value;
                  setField("tagline", val);
                  if (!editingEvent && !isStyleCustomized) {
                    runAestheticsEngine(form.title, val);
                  }
                }} 
                placeholder="e.g. An unforgettable evening of mystique, music & indulgence" 
              />
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
              <label className="evtLabel">Background Image</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  className="evtInput" 
                  style={{ flex: 1 }}
                  value={form.background_image_url || ""} 
                  onChange={(e) => setField("background_image_url", e.target.value)} 
                  placeholder="Paste URL or upload file..." 
                />
                <button
                  type="button"
                  className="evtBtnSecondary"
                  style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                  onClick={() => bgFileInputRef.current.click()}
                >
                  📁 Upload File
                </button>
                <input
                  type="file"
                  ref={bgFileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "background_image_url")}
                />
              </div>
            </div>
            {form.background_image_url && (
              <div style={{ marginTop: '10px' }}>
                <div className="evtImagePreview" style={{ backgroundImage: `url(${form.background_image_url})` }}>
                  <span className="evtImagePreviewLabel">Preview</span>
                </div>
                <button
                  type="button"
                  className="evtBtnDanger evtBtnSm"
                  style={{ marginTop: '5px' }}
                  onClick={() => setField("background_image_url", "")}
                >
                  Clear Image
                </button>
              </div>
            )}
          </div>

          {/* Theme & Styling */}
          <div className="evtSection">
            <div className="evtSectionHeader">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p className="evtSectionLabel">THEME & STYLING</p>
                {detectedVibe && (
                  <span className="evtVibeBadge">{detectedVibe}</span>
                )}
              </div>
              <button
                type="button"
                className="evtBtnAdd"
                onClick={() => runAestheticsEngine(form.title, form.tagline)}
              >
                ✨ Auto-Generate Theme
              </button>
            </div>
            <div className="evtGrid2">
              <div className="evtFormGroup">
                <label className="evtLabel">Title Font Family</label>
                <select 
                  className="evtSelect" 
                  value={form.custom_styles?.title_font || "'Cinzel Decorative', serif"}
                  onChange={(e) => setStyleField("title_font", e.target.value)}
                >
                  <option value="'Cinzel Decorative', serif">Cinzel Decorative (Elegant Serif)</option>
                  <option value="'Cinzel', serif">Cinzel (Classic Serif)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Bespoke Editorial)</option>
                  <option value="'Cormorant Garamond', serif">Cormorant Garamond (Fine Dining)</option>
                  <option value="'Montserrat', sans-serif">Montserrat (Modern Clean)</option>
                  <option value="'Outfit', sans-serif">Outfit (Premium Rounded)</option>
                  <option value="'Jost', sans-serif">Jost (Minimalist Tech)</option>
                </select>
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">Title Font Size</label>
                <select 
                  className="evtSelect" 
                  value={form.custom_styles?.title_size || "3.5rem"}
                  onChange={(e) => setStyleField("title_size", e.target.value)}
                >
                  <option value="2.5rem">Medium (2.5rem)</option>
                  <option value="3.5rem">Large (3.5rem)</option>
                  <option value="4.5rem">Extra Large (4.5rem)</option>
                </select>
              </div>
            </div>

            <div className="evtGrid2" style={{ marginTop: '1.25rem' }}>
              <div className="evtFormGroup">
                <label className="evtLabel">Title & Text Color</label>
                <div className="evtColorPickerWrap">
                  <input type="color" className="evtColorInput" value={form.custom_styles?.text_color || "#f8ebcb"} onChange={(e) => setStyleField("text_color", e.target.value)} />
                  <input type="text" className="evtInput" style={{ flex: 1, padding: '0.4rem 0.65rem' }} value={form.custom_styles?.text_color || "#f8ebcb"} onChange={(e) => setStyleField("text_color", e.target.value)} />
                </div>
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">Tagline Text Color</label>
                <div className="evtColorPickerWrap">
                  <input type="color" className="evtColorInput" value={form.custom_styles?.tagline_color || "rgba(248, 235, 203, 0.65)"} onChange={(e) => setStyleField("tagline_color", e.target.value)} />
                  <input type="text" className="evtInput" style={{ flex: 1, padding: '0.4rem 0.65rem' }} value={form.custom_styles?.tagline_color || "rgba(248, 235, 203, 0.65)"} onChange={(e) => setStyleField("tagline_color", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="evtGrid2" style={{ marginTop: '1.25rem' }}>
              <div className="evtFormGroup">
                <label className="evtLabel">Accent / Gold Color</label>
                <div className="evtColorPickerWrap">
                  <input type="color" className="evtColorInput" value={form.custom_styles?.accent_color || "#c8852a"} onChange={(e) => setStyleField("accent_color", e.target.value)} />
                  <input type="text" className="evtInput" style={{ flex: 1, padding: '0.4rem 0.65rem' }} value={form.custom_styles?.accent_color || "#c8852a"} onChange={(e) => setStyleField("accent_color", e.target.value)} />
                </div>
              </div>
              <div className="evtFormGroup">
                <label className="evtLabel">Overlay Color</label>
                <div className="evtColorPickerWrap">
                  <input type="color" className="evtColorInput" value={form.custom_styles?.overlay_color || "#0a0603"} onChange={(e) => setStyleField("overlay_color", e.target.value)} />
                  <input type="text" className="evtInput" style={{ flex: 1, padding: '0.4rem 0.65rem' }} value={form.custom_styles?.overlay_color || "#0a0603"} onChange={(e) => setStyleField("overlay_color", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="evtFormGroup" style={{ marginTop: '1.25rem' }}>
              <label className="evtLabel">Overlay Opacity: {Math.round((form.custom_styles?.overlay_opacity || 0.82) * 100)}%</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                className="evtSlider" 
                value={form.custom_styles?.overlay_opacity || 0.82} 
                onChange={(e) => setStyleField("overlay_opacity", Number(e.target.value))} 
              />
            </div>
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
                <label className="evtLabel">QR Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    className="evtInput" 
                    style={{ flex: 1 }}
                    value={form.qr_image_url || ""} 
                    onChange={(e) => setField("qr_image_url", e.target.value)} 
                    placeholder="Paste URL or upload file..." 
                  />
                  <button
                    type="button"
                    className="evtBtnSecondary"
                    style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                    onClick={() => qrFileInputRef.current.click()}
                  >
                    📁 Upload File
                  </button>
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "qr_image_url")}
                  />
                </div>
                {form.qr_image_url && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                    <img 
                      src={form.qr_image_url} 
                      alt="QR Preview" 
                      style={{ maxWidth: '120px', maxHeight: '120px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', objectFit: 'contain' }} 
                    />
                    <button
                      type="button"
                      className="evtBtnDanger evtBtnSm"
                      onClick={() => setField("qr_image_url", "")}
                    >
                      Clear QR
                    </button>
                  </div>
                )}
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
