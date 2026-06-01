import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase"; // Make sure this path matches your project structure
import { useAuth } from "../../context/AuthContext";
import "./ReservationPipeline.css";

// Updated stages to match your Supabase PostgreSQL ENUM exactly
const STAGES = ["new", "reviewing", "accepted", "declined"];

const STAGE_LABELS = {
  new: "New Leads",
  reviewing: "Reviewing / Contacted",
  accepted: "Accepted / Confirmed",
  declined: "Declined",
};

const SERVICE_COLORS = {
  table:       "#C8852A",
  event:       "#2A8C7A",
  golf:        "#4A7AB5",
  golf_dining: "#7A5AB5",
};

// Helper to translate Supabase modal sources to your Kanban labels
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

function ReservationCard({ reservation, onStageChange, canManage }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(reservation.manager_notes || "");
  const { user } = useAuth();

  const handleStage = async (stage) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          stage: stage,
          manager_notes: note 
        })
        .eq('id', reservation.id); // Supabase uses 'id', not '_id'
        
      if (error) throw error;
      onStageChange(); // trigger UI refresh or rely on Realtime
    } catch (e) { 
      console.error("Error updating stage:", e); 
    }
  };

  const serviceKey = getServiceType(reservation.source_modal);
  const color = SERVICE_COLORS[serviceKey] || "#8C7B6A";

  // Parse Supabase JSONB details
  const details = reservation.details || {};

  return (
    <motion.div
      className="resCard"
      style={{ borderLeftColor: color }}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="resCardTop">
        <span className="resServiceLabel" style={{ color }}>{SERVICE_LABELS[serviceKey]}</span>
        <span className="resTimeAgo">{timeAgo(reservation.created_at)}</span>
      </div>

      <h3 className="resGuestName">{reservation.name}</h3>

      <div className="resCardMeta">
        {reservation.phone && <p className="resMeta">📞 {reservation.phone}</p>}
        {reservation.date && <p className="resMeta">📅 {reservation.date}{reservation.time_slot ? `, ${reservation.time_slot}` : ""}</p>}
        {reservation.guests && <p className="resMeta">👥 {reservation.guests} guests</p>}
      </div>

      {details.occasion && (
        <p className="resNote">{details.occasion}</p>
      )}

      <button className="resExpandBtn" onClick={() => setExpanded((p) => !p)}>
        {expanded ? "Hide actions ▲" : "Show actions ▼"}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="resActions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <input
              className="formInput"
              placeholder="Add a manager note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}
            />
            <div className="resActionBtns">
              {reservation.stage === "new" && canManage && (
                <button className="btnSecondary" style={{ fontSize: "0.62rem" }}
                  onClick={() => handleStage("reviewing")}>Mark Contacted</button>
              )}
              {reservation.stage === "reviewing" && canManage && (
                <>
                  <button className="btnPrimary" style={{ fontSize: "0.62rem" }}
                    onClick={() => handleStage("accepted")}>Confirm ✓</button>
                  <button className="btnDanger" style={{ fontSize: "0.62rem" }}
                    onClick={() => handleStage("declined")}>Decline ✕</button>
                </>
              )}
              {reservation.stage === "accepted" && (
                <button className="btnPrimary" style={{ fontSize: "0.62rem", background: "#48B076" }}
                  onClick={() => handleStage("completed")}>Check In ✓</button>
              )}
              {reservation.phone && (
                <a
                  href={`tel:${reservation.phone}`}
                  className="btnSecondary"
                  style={{ fontSize: "0.62rem", padding: "0.4rem 0.75rem", display: "inline-block", textAlign: "center" }}
                >
                  📞 Call
                </a>
              )}
              {reservation.phone && (
                <a
                  href={`https://wa.me/${reservation.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btnSecondary"
                  style={{ fontSize: "0.62rem", padding: "0.4rem 0.75rem", display: "inline-block", textAlign: "center", color: "#48B076", borderColor: "rgba(72,176,118,0.3)" }}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {reservation.manager_notes && (
        <p className="resNote" style={{ marginTop: "0.4rem", borderTop: "1px solid #F0EAE0", paddingTop: "0.4rem" }}>
          Note: {reservation.manager_notes}
        </p>
      )}
    </motion.div>
  );
}

export default function ReservationPipeline() {
  const { can } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
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
      
      // Calculate stats locally from Supabase data
      setStats({
        newLeads: data?.filter(r => r.stage === 'new').length || 0,
        contacted: data?.filter(r => r.stage === 'reviewing').length || 0,
        confirmed: data?.filter(r => r.stage === 'accepted').length || 0,
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

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('reservations-pipeline')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // Recalculate stats whenever reservations state changes (keeps top chips live)
  useEffect(() => {
    setStats({
      newLeads: reservations.filter(r => r.stage === 'new').length,
      contacted: reservations.filter(r => r.stage === 'reviewing').length,
      confirmed: reservations.filter(r => r.stage === 'accepted').length,
      declined: reservations.filter(r => r.stage === 'declined').length,
    });
  }, [reservations]);

  const byStage = (stage) => reservations.filter((r) => r.stage === stage);

  return (
    <div className="pipelinePage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Reservation Pipeline</h2>
          <p className="dashPanelSub">Live Supabase Connection · Leads & Events</p>
        </div>
        <button className="btnSecondary" onClick={fetchAll}>Refresh</button>
      </div>

      <div className="statsBar">
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#4A7AB5" }}>{stats.newLeads}</span>
          <span className="statChipLabel">NEW LEADS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C8852A" }}>{stats.contacted}</span>
          <span className="statChipLabel">CONTACTED</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#48B076" }}>{stats.confirmed}</span>
          <span className="statChipLabel">CONFIRMED</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C04040" }}>{stats.declined}</span>
          <span className="statChipLabel">DECLINED</span>
        </div>
      </div>

      {loading ? (
        <div className="emptyState"><p className="emptyStateText">Loading pipeline...</p></div>
      ) : (
        <div className="pipelineBoard">
          {STAGES.map((stage) => {
            const cards = byStage(stage);
            return (
              <div key={stage} className={`pipelineCol pipelineCol-${stage}`}>
                <div className={`pipelineColHeader col-${stage}`}>
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="pipelineColBadge">{cards.length}</span>
                </div>
                <div className="pipelineColBody">
                  <AnimatePresence>
                    {cards.length === 0 ? (
                      <div className="emptyState" style={{ padding: "2rem 1rem" }}>
                        <p className="emptyStateText" style={{ fontSize: "0.8rem" }}>No leads</p>
                      </div>
                    ) : (
                      cards.map((r) => (
                        <ReservationCard
                          key={r.id}
                          reservation={r}
                          canManage={canManage}
                          onStageChange={fetchAll}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}