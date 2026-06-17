import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./ReservationPipeline.css";

const STAGES = ["new", "reviewing", "accepted", "declined"];

const STAGE_LABELS = {
  new: "New Leads",
  reviewing: "Reviewing",
  accepted: "Confirmed",
  declined: "Declined",
};

const SERVICE_COLORS = {
  table:       "#C8852A",
  event:       "#2A8C7A",
  golf:        "#4A7AB5",
  golf_dining: "#7A5AB5",
};

const getServiceType = (sourceModal) => {
  switch (sourceModal) {
    case 'TableBookingModal': return 'table';
    case 'EventEnquiryModal': return 'event';
    case 'GolfBookingModal': return 'golf';
    case 'GolfDiningModal': return 'golf_dining';
    default: return 'table';
  }
};

const SERVICE_LABELS = {
  table: "TABLE",
  event: "EVENT",
  golf: "GOLF",
  golf_dining: "GOLF & DINING",
};

function timeAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReservationCard({ reservation, isActive, onClick }) {
  const serviceKey = getServiceType(reservation.source_modal);
  const color = SERVICE_COLORS[serviceKey] || "#8C7B6A";

  return (
    <button
      className={`resMasterCard ${isActive ? "resMasterActive" : ""}`}
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="resCardHeader">
        <span className="resCardName">{reservation.name}</span>
        <span className="resCardAgo">{timeAgo(reservation.created_at)}</span>
      </div>
      <div className="resCardMeta">
        <span>📅 {reservation.date || "No Date"}</span>
        <span>👥 {reservation.guests || 1} pax</span>
      </div>
      <div className="resCardFooter">
        <span className="resCardTag" style={{ color, borderColor: `${color}33` }}>
          {SERVICE_LABELS[serviceKey]}
        </span>
        {reservation.time_slot && (
          <span className="resCardTimeSlot">🕐 {reservation.time_slot}</span>
        )}
      </div>
    </button>
  );
}

function ReservationDetail({ reservation, canManage, onStageChange }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(reservation?.manager_notes || "");
  }, [reservation]);

  if (!reservation) {
    return (
      <div className="resDetailEmpty">
        <div className="resDetailEmptyIcon">📖</div>
        <p className="resDetailEmptyText">Select a reservation to view details</p>
      </div>
    );
  }

  const sendWhatsAppNotification = (stage) => {
    const guestName = reservation.name || "Guest";
    const phone = (reservation.phone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("No phone number found for this reservation.");
      return;
    }

    const date = reservation.date || "";
    const time = reservation.time_slot || "";
    const guests = reservation.guests || 1;
    const serviceKey = getServiceType(reservation.source_modal);
    const serviceName = SERVICE_LABELS[serviceKey] || "Reservation";

    let message = "";
    if (stage === "accepted") {
      message = `Hi *${guestName}*,\n\nYour *${serviceName}* reservation at *Basque Dehradun* has been *CONFIRMED*! ✅\n\n📅 *Date*: ${date}\n🕐 *Time*: ${time ? time : "Not Specified"}\n👥 *Guests*: ${guests} pax\n\nWe look forward to hosting you!\n\nWarm regards,\n*Basque Dehradun*`;
    } else if (stage === "declined") {
      message = `Hi *${guestName}*,\n\nThank you for reaching out to *Basque Dehradun*.\n\nWe regret to inform you that we are *unable to accommodate* your *${serviceName}* reservation request for ${date}${time ? ` at ${time}` : ""} due to being fully booked. ✕\n\nWarm regards,\n*Basque Dehradun*`;
    }

    const finalPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const waUrl = isMobile
      ? `whatsapp://send?phone=${finalPhone}&text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  const handleStage = async (stage) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ stage, manager_notes: note })
        .eq('id', reservation.id);

      if (error) throw error;
      toast.success(`Moved to ${STAGE_LABELS[stage] || stage}`);

      if (stage === "accepted" || stage === "declined") {
        sendWhatsAppNotification(stage);
      }

      onStageChange();
    } catch (e) {
      console.error("Error updating stage:", e);
      toast.error("Failed to update reservation stage.");
    }
  };

  const handleSaveNote = async () => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ manager_notes: note })
        .eq('id', reservation.id);
      if (error) throw error;
      toast.success("Manager notes saved");
      onStageChange();
    } catch (e) {
      console.error("Save note failed:", e);
      toast.error("Failed to save note");
    }
  };

  const serviceKey = getServiceType(reservation.source_modal);
  const color = SERVICE_COLORS[serviceKey] || "#8C7B6A";
  const details = reservation.details || {};

  return (
    <div className="resDetailContent">
      <div className="resDetailHeader" style={{ borderLeftColor: color }}>
        <span className="resDetailService" style={{ color }}>{SERVICE_LABELS[serviceKey]}</span>
        <h2 className="resDetailName">{reservation.name}</h2>
        <span className="resDetailTimeAgo">Received {timeAgo(reservation.created_at)}</span>
      </div>

      <div className="resDetailGrid">
        <div className="resDetailField">
          <label className="resDetailLabel">DATE</label>
          <span className="resDetailValue">{reservation.date || "Not Specified"}</span>
        </div>
        <div className="resDetailField">
          <label className="resDetailLabel">TIME SLOT</label>
          <span className="resDetailValue">{reservation.time_slot || "Not Specified"}</span>
        </div>
        <div className="resDetailField">
          <label className="resDetailLabel">GUESTS</label>
          <span className="resDetailValue">{reservation.guests ? `${reservation.guests} pax` : "1 pax"}</span>
        </div>
        <div className="resDetailField">
          <label className="resDetailLabel">PHONE</label>
          <span className="resDetailValue">{reservation.phone || "No Phone"}</span>
        </div>
        {details.occasion && (
          <div className="resDetailField span2">
            <label className="resDetailLabel">OCCASION</label>
            <span className="resDetailValue">🎉 {details.occasion}</span>
          </div>
        )}
      </div>

      <div className="resDetailNotesSection">
        <label className="resDetailLabel">MANAGER NOTES</label>
        <div className="resDetailNotesInputWrapper">
          <textarea
            className="resDetailNotesTextarea"
            placeholder="Add reservation notes (table preference, guest allergies, special details)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btnSecondary resSaveNoteBtn" onClick={handleSaveNote}>
            Save Note
          </button>
        </div>
      </div>

      <div className="resDetailActions">
        <div className="resDetailActionGroup">
          {(reservation.stage === "new" || reservation.stage === "reviewing") && canManage && (
            <>
              <button className="btnPrimary resActionBtn" onClick={() => handleStage("accepted")}>
                ✓ Confirm Reservation
              </button>
              <button className="btnDanger resActionBtn" onClick={() => handleStage("declined")}>
                ✕ Decline Booking
              </button>
              {reservation.stage === "new" && (
                <button className="btnSecondary resActionBtn" onClick={() => handleStage("reviewing")}>
                  Mark Contacted
                </button>
              )}
            </>
          )}
          {reservation.stage === "accepted" && (
            <button
              className="btnPrimary resActionBtn"
              style={{ background: "#48B076" }}
              onClick={() => handleStage("completed")}
            >
              ✓ Check In Guest
            </button>
          )}
        </div>

        {reservation.phone && (
          <div className="resDetailContactGroup">
            <a href={`tel:${reservation.phone}`} className="btnSecondary resContactBtn">
              📞 Call Guest
            </a>
            <a
              href={`https://wa.me/${reservation.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btnSecondary resContactBtn resWaBtn"
            >
              💬 WhatsApp Notify
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationPipeline({ onNewCount }) {
  const { can } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("new");
  const [selectedId, setSelectedId] = useState(null);
  const canManage = can("reservations_manage");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
      setStats({
        new: data?.filter(r => r.stage === 'new').length || 0,
        reviewing: data?.filter(r => r.stage === 'reviewing').length || 0,
        accepted: data?.filter(r => r.stage === 'accepted').length || 0,
        declined: data?.filter(r => r.stage === 'declined').length || 0,
      });
    } catch (e) {
      console.error("Error fetching reservations:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('reservations-pipeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        setReservations((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (payload) => {
        setReservations((prev) =>
          prev.map((r) => (r.id === payload.new.id ? payload.new : r))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  useEffect(() => {
    const newCount = reservations.filter(r => r.stage === 'new').length;
    setStats({
      new: newCount,
      reviewing: reservations.filter(r => r.stage === 'reviewing').length,
      accepted: reservations.filter(r => r.stage === 'accepted').length,
      declined: reservations.filter(r => r.stage === 'declined').length,
    });
    if (onNewCount) onNewCount(newCount);
  }, [reservations, onNewCount]);

  const byStage = (stage) => reservations.filter((r) => r.stage === stage);

  const stageReservations = byStage(activeStage);

  // Auto-select first item when stage or reservations change
  useEffect(() => {
    if (stageReservations.length > 0) {
      const found = stageReservations.some(r => r.id === selectedId);
      if (!found) {
        setSelectedId(stageReservations[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [activeStage, reservations, selectedId, stageReservations]);

  const stageColors = { new: "#4A7AB5", reviewing: "#C8852A", accepted: "#48B076", declined: "#C04040" };

  return (
    <div className="resPipelinePage">
      {/* Header */}
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Reservation Pipeline</h2>
          <p className="dashPanelSub">Live Supabase Connection · Leads & Events</p>
        </div>
        <button className="btnSecondary" onClick={fetchAll}>Refresh</button>
      </div>

      <div className="resSplitLayout">
        {/* Left Master List */}
        <div className="resMasterPane">
          {/* Stage Pill Tabs */}
          <div className="resStageTabs">
            {STAGES.map((stage) => (
              <button
                key={stage}
                className={`resStageTab ${activeStage === stage ? "resStageTabActive" : ""}`}
                style={activeStage === stage ? { borderColor: stageColors[stage], color: stageColors[stage] } : {}}
                onClick={() => setActiveStage(stage)}
              >
                {STAGE_LABELS[stage]}
                <span
                  className="resStageTabBadge"
                  style={activeStage === stage ? { background: stageColors[stage] } : {}}
                >
                  {stats[stage] || 0}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="emptyState"><p className="emptyStateText">Loading pipeline...</p></div>
          ) : (
            <div className="resRowList">
              <AnimatePresence mode="popLayout">
                {stageReservations.length === 0 ? (
                  <div className="emptyState" style={{ padding: "3rem 1rem" }}>
                    <p className="emptyStateText">No {STAGE_LABELS[activeStage]} leads</p>
                  </div>
                ) : (
                  stageReservations.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ReservationCard
                        reservation={r}
                        isActive={selectedId === r.id}
                        onClick={() => setSelectedId(r.id)}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="resDetailPane">
          <ReservationDetail
            reservation={stageReservations.find(r => r.id === selectedId)}
            canManage={canManage}
            onStageChange={fetchAll}
          />
        </div>
      </div>
    </div>
  );
}