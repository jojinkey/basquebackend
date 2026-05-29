import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { reservationsApi } from "../../services/api";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "./ReservationPipeline.css";

const STAGES = ["new", "contacted", "confirmed", "declined"];

const STAGE_LABELS = {
  new: "New Leads",
  contacted: "Contacted",
  confirmed: "Confirmed",
  declined: "Declined",
};

const SERVICE_COLORS = {
  table:      "#C8852A",
  event:      "#2A8C7A",
  golf:       "#4A7AB5",
  golf_dining: "#7A5AB5",
};

const SERVICE_LABELS = {
  table: "TABLE",
  event: "EVENT",
  golf: "GOLF",
  golf_dining: "GOLF & DINING",
};

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReservationCard({ reservation, onStageChange, canManage }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const { user } = useAuth();

  const handleStage = async (stage) => {
    try {
      await reservationsApi.updateStage(reservation._id, {
        stage,
        stageNote: note,
        performer: { name: user?.name, role: user?.role },
      });
      onStageChange();
    } catch (e) { console.error(e); }
  };

  const color = SERVICE_COLORS[reservation.service] || "#8C7B6A";

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
        <span className="resServiceLabel" style={{ color }}>{SERVICE_LABELS[reservation.service]}</span>
        <span className="resTimeAgo">{timeAgo(reservation.createdAt)}</span>
      </div>

      <h3 className="resGuestName">{reservation.name}</h3>

      <div className="resCardMeta">
        {reservation.phone && <p className="resMeta">📞 {reservation.phone}</p>}
        {reservation.date && <p className="resMeta">📅 {reservation.date}{reservation.time ? `, ${reservation.time}` : ""}</p>}
        {reservation.guests && <p className="resMeta">👥 {reservation.guests} guests</p>}
      </div>

      {reservation.details?.occasion && (
        <p className="resNote">{reservation.details.occasion}</p>
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
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}
            />
            <div className="resActionBtns">
              {reservation.stage === "new" && canManage && (
                <button className="btnSecondary" style={{ fontSize: "0.62rem" }}
                  onClick={() => handleStage("contacted")}>Mark Contacted</button>
              )}
              {reservation.stage === "contacted" && canManage && (
                <>
                  <button className="btnPrimary" style={{ fontSize: "0.62rem" }}
                    onClick={() => handleStage("confirmed")}>Confirm ✓</button>
                  <button className="btnDanger" style={{ fontSize: "0.62rem" }}
                    onClick={() => handleStage("declined")}>Decline ✕</button>
                </>
              )}
              {reservation.stage === "confirmed" && (
                <button className="btnPrimary" style={{ fontSize: "0.62rem", background: "#48B076" }}
                  onClick={() => handleStage("checked_in")}>Check In ✓</button>
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

      {reservation.stageNote && (
        <p className="resNote" style={{ marginTop: "0.4rem", borderTop: "1px solid #F0EAE0", paddingTop: "0.4rem" }}>
          Note: {reservation.stageNote}
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
      const [resRes, statsRes] = await Promise.all([
        reservationsApi.getAll(),
        reservationsApi.getStats(),
      ]);
      setReservations(resRes.data);
      setStats(statsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();

    socket.on("reservation:new", (res) => {
      setReservations((prev) => {
        const exists = prev.some((r) => r._id === res._id);
        if (exists) return prev;
        return [res, ...prev];
      });
    });

    socket.on("reservation:updated", (updated) => {
      setReservations((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    });

    return () => {
      socket.off("reservation:new");
      socket.off("reservation:updated");
    };
  }, [fetchAll]);

  const byStage = (stage) => reservations.filter((r) => r.stage === stage);

  return (
    <div className="pipelinePage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Reservation Pipeline</h2>
          <p className="dashPanelSub">Website leads · Golf · Events · Dining</p>
        </div>
        <button className="btnSecondary" onClick={fetchAll}>Refresh</button>
      </div>

      <div className="statsBar">
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#4A7AB5" }}>{stats.newLeads ?? "—"}</span>
          <span className="statChipLabel">NEW LEADS</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C8852A" }}>{stats.contacted ?? "—"}</span>
          <span className="statChipLabel">CONTACTED</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#48B076" }}>{stats.confirmed ?? "—"}</span>
          <span className="statChipLabel">CONFIRMED</span>
        </div>
        <div className="statChip">
          <span className="statChipValue" style={{ color: "#C04040" }}>{stats.declined ?? "—"}</span>
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
                          key={r._id}
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
