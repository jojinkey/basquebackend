import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { tablesApi } from "../../services/api";
import "./ReservationPipeline.css";

const STAGE_LABELS = {
  new: "New Lead",
  reviewing: "Reviewing",
  accepted: "Confirmed",
  declined: "Declined",
  completed: "Completed / Seated",
};

const SERVICE_COLORS = {
  table:       "#d4af37", // Gold
  event:       "#705a4f", // Dark Brown
  golf:        "#8c7e76", // Stone
  golf_dining: "#B08A4E", // Secondary Gold
};

const SERVICE_LABELS = {
  table: "TABLE",
  event: "EVENT",
  golf: "GOLF",
  golf_dining: "GOLF & DINING",
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

function timeAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PipelineCard({ 
  reservation, 
  tablesList, 
  canManage, 
  onConfirm, 
  onDecline, 
  onStageChange, 
  onCheckIn, 
  onSaveNote,
  allReservations
}) {
  const [selectedTable, setSelectedTable] = useState(reservation?.details?.tableId || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(reservation?.manager_notes || "");

  const assignedTableIds = useMemo(() => {
    if (!reservation.date || !reservation.time_slot || !allReservations) return [];
    return allReservations
      .filter(r => 
        r.id !== reservation.id && 
        (r.stage === "accepted" || r.stage === "completed") && 
        r.date === reservation.date && 
        r.time_slot === reservation.time_slot && 
        r.details?.tableId
      )
      .map(r => String(r.details.tableId));
  }, [reservation.date, reservation.time_slot, reservation.id, allReservations]);

  useEffect(() => {
    setSelectedTable(reservation?.details?.tableId || "");
    setNote(reservation?.manager_notes || "");
  }, [reservation]);

  const serviceKey = getServiceType(reservation.source_modal);
  const color = SERVICE_COLORS[serviceKey] || "#8c7e76";
  const details = reservation.details || {};
  const isLead = reservation.stage === "new" || reservation.stage === "reviewing";
  const isAccepted = reservation.stage === "accepted";
  const isCompleted = reservation.stage === "completed";
  const isDeclined = reservation.stage === "declined";

  return (
    <div 
      className={`pipelineCard ${isAccepted ? "pipelineCardConfirmed" : ""} ${isCompleted ? "pipelineCardCompleted" : ""} ${isDeclined ? "pipelineCardDeclined" : ""}`}
      style={{ borderLeftColor: color }}
    >
      {/* Card Header */}
      <div className="pipelineCardHeader">
        <div className="pipelineCardTitleRow">
          <span className="pipelineCardName">{reservation.name}</span>
          <span className="pipelineCardAgo">{timeAgo(reservation.created_at)}</span>
        </div>
        <div className="pipelineCardSubtitleRow">
          <span className="pipelineCardService" style={{ color }}>
            {SERVICE_LABELS[serviceKey]}
          </span>
          {reservation.phone && (
            <div className="pipelineCardContactLinks">
              <a href={`tel:${reservation.phone}`} title="Call Guest">📞</a>
              <a 
                href={`https://wa.me/${reservation.phone.replace(/\D/g, "")}`} 
                target="_blank" 
                rel="noopener noreferrer"
                title="WhatsApp Message"
              >
                💬
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Card Body Details */}
      <div className="pipelineCardBody">
        <div className="pipelineCardGrid">
          <div><span className="pipelineCardMetaLabel">DATE</span> <strong>{reservation.date || "N/A"}</strong></div>
          <div><span className="pipelineCardMetaLabel">TIME</span> <strong>{reservation.time_slot || "N/A"}</strong></div>
          <div><span className="pipelineCardMetaLabel">PAX</span> <strong>{reservation.guests || 1} pax</strong></div>
          <div>
            <span className="pipelineCardMetaLabel">ASSIGNED</span>
            {details.tableId ? (
              <span className="pipelineCardTableAssigned">📍 Table {details.tableId}</span>
            ) : (
              <span className="pipelineCardUnassigned">Unassigned</span>
            )}
          </div>
        </div>

        {details.occasion && (
          <div className="pipelineCardOccasion">
            🎉 Occasion: {details.occasion}
          </div>
        )}
      </div>

      {/* Table Selection Dropdown (Only for active reviewable leads) */}
      {isLead && canManage && (
        <div className="pipelineCardSelectSection">
          <label className="pipelineCardMetaLabel">SELECT TABLE</label>
          <select
            className="pipelineCardSelect"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="">-- Assign Table --</option>
            {tablesList.map((t) => {
              const isTableAssigned = assignedTableIds.includes(String(t.tableId));
              return (
                <option key={t.tableId} value={t.tableId} disabled={isTableAssigned}>
                  Table {t.tableId} ({t.pax} pax) - {t.section} {isTableAssigned ? "[OCCUPIED]" : `[${t.status}]`}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Note Area */}
      <div className="pipelineCardNotes">
        {isEditingNote ? (
          <div className="pipelineCardNotesEdit">
            <textarea
              className="pipelineCardNotesTextarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add manager notes..."
            />
            <div className="pipelineCardNotesEditButtons">
              <button 
                className="pipelineCardNotesSave" 
                onClick={() => {
                  onSaveNote(reservation, note);
                  setIsEditingNote(false);
                }}
              >
                Save
              </button>
              <button 
                className="pipelineCardNotesCancel" 
                onClick={() => {
                  setNote(reservation?.manager_notes || "");
                  setIsEditingNote(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="pipelineCardNotesDisplay">
            <span className="pipelineCardNotesText">
              {reservation.manager_notes ? `📝 ${reservation.manager_notes}` : "No notes added"}
            </span>
            <button 
              className="pipelineCardNotesEditBtn" 
              onClick={() => setIsEditingNote(true)}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {canManage && (
        <div className="pipelineCardActions">
          {isLead && (
            <>
              <button 
                className="pipelineCardBtn pipelineCardConfirm"
                onClick={() => onConfirm(reservation, selectedTable, note)}
                disabled={!selectedTable}
              >
                Confirm
              </button>
              <button 
                className="pipelineCardBtn pipelineCardDecline"
                onClick={() => onDecline(reservation, "declined", note)}
              >
                Decline
              </button>
              {reservation.stage === "new" && (
                <button 
                  className="pipelineCardBtn pipelineCardReview"
                  onClick={() => onStageChange(reservation, "reviewing", note)}
                >
                  Contacted
                </button>
              )}
            </>
          )}

          {isAccepted && (
            <button 
              className="pipelineCardBtn pipelineCardCheckIn"
              onClick={() => onCheckIn(reservation)}
            >
              ✓ Seat Guest
            </button>
          )}

          {isCompleted && (
            <button 
              className="pipelineCardBtn pipelineCardRestore"
              onClick={() => onStageChange(reservation, "accepted", note)}
            >
              Un-seat Guest
            </button>
          )}

          {isDeclined && (
            <button 
              className="pipelineCardBtn pipelineCardRestore"
              onClick={() => onStageChange(reservation, "new", note)}
            >
              Restore Lead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReservationPipeline({ onNewCount }) {
  const { user, can } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [tablesList, setTablesList] = useState([]);
  const [viewMode, setViewMode] = useState("active"); // "active" (leads/confirmed) or "history" (declined/completed)
  
  const [isMobile, setIsMobile] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setExpandedColumn(null);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleColumn = (colName) => {
    setExpandedColumn(prev => prev === colName ? null : colName);
  };

  const canManage = can("reservations_manage");

  const fetchTables = useCallback(async () => {
    try {
      const res = await tablesApi.getAll();
      setTablesList(res.data || []);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  }, []);

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
        completed: data?.filter(r => r.stage === 'completed').length || 0,
      });
    } catch (e) {
      console.error("Error fetching reservations:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchTables();

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
  }, [fetchAll, fetchTables]);

  useEffect(() => {
    const newCount = reservations.filter(r => r.stage === 'new').length;
    setStats({
      new: newCount,
      reviewing: reservations.filter(r => r.stage === 'reviewing').length,
      accepted: reservations.filter(r => r.stage === 'accepted').length,
      declined: reservations.filter(r => r.stage === 'declined').length,
      completed: reservations.filter(r => r.stage === 'completed').length,
    });
    if (onNewCount) onNewCount(newCount);
  }, [reservations, onNewCount]);

  const sendWhatsAppNotification = (reservation, stage) => {
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

  const handleStageChange = async (reservation, stage, noteText) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ stage, manager_notes: noteText })
        .eq('id', reservation.id);

      if (error) throw error;
      toast.success(`Moved to ${STAGE_LABELS[stage] || stage}`);

      if (stage === "accepted" || stage === "declined") {
        sendWhatsAppNotification(reservation, stage);
      }
      
      fetchAll();
      fetchTables();
    } catch (e) {
      console.error("Error updating stage:", e);
      toast.error("Failed to update reservation stage.");
    }
  };

  const handleConfirmReservation = async (reservation, tableId, noteText) => {
    if (!tableId) {
      toast.error("Please assign a table before confirming.");
      return;
    }
    try {
      const updatedDetails = {
        ...(reservation.details || {}),
        tableId: tableId,
        tableName: `Table ${tableId}`
      };

      const { error } = await supabase
        .from('reservations')
        .update({
          stage: "accepted",
          manager_notes: noteText || reservation.manager_notes || "",
          details: updatedDetails
        })
        .eq('id', reservation.id);

      if (error) throw error;
      toast.success("Reservation confirmed and table assigned.");
      sendWhatsAppNotification(reservation, "accepted");
      
      fetchAll();
      fetchTables();
    } catch (e) {
      console.error("Error confirming reservation:", e);
      toast.error("Failed to confirm reservation.");
    }
  };

  const handleCheckIn = async (reservation) => {
    try {
      const assignedTableId = reservation.details?.tableId;
      if (assignedTableId) {
        await tablesApi.updateStatus(assignedTableId, {
          status: "seated",
          guest: reservation.name,
          performer: { name: user?.name, role: user?.role }
        });
        toast.success(`Table ${assignedTableId} allocated to ${reservation.name}`);
      }

      const { error } = await supabase
        .from('reservations')
        .update({ stage: "completed" })
        .eq('id', reservation.id);

      if (error) throw error;
      toast.success("Guest checked in successfully.");
      
      fetchAll();
      fetchTables();
    } catch (e) {
      console.error("Error checking in guest:", e);
      toast.error("Failed to check in guest.");
    }
  };

  const handleSaveNote = async (reservation, noteText) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ manager_notes: noteText })
        .eq('id', reservation.id);
      if (error) throw error;
      toast.success("Manager notes saved");
      fetchAll();
    } catch (e) {
      console.error("Save note failed:", e);
      toast.error("Failed to save note");
    }
  };

  const getReservationsByStage = (stage) => reservations.filter((r) => r.stage === stage);

  return (
    <div className="resPipelinePage">
      {/* Dashboard Top Header */}
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">RESERVATION PIPELINE</h2>
          <p className="dashPanelSub">LIVE RESTAURANT HOST DASHBOARD · SHARP EDGES · STITCH GASTRONOMY UI</p>
        </div>
        <div className="dashPanelActions">
          <button 
            className={`btnOutlined ${viewMode === "active" ? "btnViewModeActive" : ""}`}
            onClick={() => setViewMode("active")}
            style={{ padding: "0.5rem 1rem", fontSize: "0.68rem" }}
          >
            ACTIVE LEADS
          </button>
          <button 
            className={`btnOutlined ${viewMode === "history" ? "btnViewModeActive" : ""}`}
            onClick={() => setViewMode("history")}
            style={{ padding: "0.5rem 1rem", fontSize: "0.68rem" }}
          >
            HISTORY
          </button>
          <button 
            className="btnSecondary" 
            onClick={() => { fetchAll(); fetchTables(); }}
            style={{ padding: "0.5rem 1rem", fontSize: "0.68rem" }}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Premium Real-Time Table Status Summary Bar */}
      <div className="resDashboardStatsBar">
        <div className="resDashboardStatItem">
          <span className="resDashboardStatVal">{tablesList.length}</span>
          <span className="resDashboardStatLabel">TOTAL TABLES</span>
        </div>
        <div className="resDashboardStatItem statusVacant">
          <span className="resDashboardStatVal">
            {tablesList.filter(t => t.status === 'vacant').length}
          </span>
          <span className="resDashboardStatLabel">VACANT</span>
        </div>
        <div className="resDashboardStatItem statusReserved">
          <span className="resDashboardStatVal">
            {tablesList.filter(t => t.status === 'reserved').length}
          </span>
          <span className="resDashboardStatLabel">RESERVED</span>
        </div>
        <div className="resDashboardStatItem statusSeated">
          <span className="resDashboardStatVal">
            {tablesList.filter(t => t.status === 'seated').length}
          </span>
          <span className="resDashboardStatLabel">SEATED / BUSY</span>
        </div>
      </div>

      {loading ? (
        <div className="resPipelineLoading">
          <div className="spinner"></div>
          <p>LOADING PIPELINE CHANNELS...</p>
        </div>
      ) : (
        <div className="resBoardLayout">
          {viewMode === "active" ? (
            <>
              {/* Column 1: New Leads */}
              <div className={`resBoardColumn ${isMobile && expandedColumn === "new" ? "resColumnExpanded" : ""}`}>
                <div 
                  className="resColumnHeader borderNew"
                  onClick={() => isMobile && toggleColumn("new")}
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isMobile && (
                      <span className="resColumnArrow">
                        ▶
                      </span>
                    )}
                    <h3>NEW REQUESTS</h3>
                  </div>
                  <span className="resColumnBadge">{stats.new || 0}</span>
                </div>
                
                <motion.div 
                  initial={isMobile ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                  animate={
                    !isMobile || expandedColumn === "new"
                      ? { height: "auto", opacity: 1, display: "flex" }
                      : { height: 0, opacity: 0, transitionEnd: { display: "none" } }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="resColumnCards"
                >
                  <div className="resColumnCardsInner">
                    <AnimatePresence mode="popLayout">
                      {getReservationsByStage("new").length === 0 ? (
                        <div className="resColumnEmpty">
                          <p>No new leads</p>
                        </div>
                      ) : (
                        getReservationsByStage("new").map((r) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: "100%" }}
                          >
                            <PipelineCard
                              reservation={r}
                              tablesList={tablesList}
                              canManage={canManage}
                              onConfirm={handleConfirmReservation}
                              onDecline={handleStageChange}
                              onStageChange={handleStageChange}
                              onCheckIn={handleCheckIn}
                              onSaveNote={handleSaveNote}
                              allReservations={reservations}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Column 2: Reviewing */}
              <div className={`resBoardColumn ${isMobile && expandedColumn === "reviewing" ? "resColumnExpanded" : ""}`}>
                <div 
                  className="resColumnHeader borderReviewing"
                  onClick={() => isMobile && toggleColumn("reviewing")}
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isMobile && (
                      <span className="resColumnArrow">
                        ▶
                      </span>
                    )}
                    <h3>CONTACTED & REVIEWING</h3>
                  </div>
                  <span className="resColumnBadge">{stats.reviewing || 0}</span>
                </div>
                
                <motion.div 
                  initial={isMobile ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                  animate={
                    !isMobile || expandedColumn === "reviewing"
                      ? { height: "auto", opacity: 1, display: "flex" }
                      : { height: 0, opacity: 0, transitionEnd: { display: "none" } }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="resColumnCards"
                >
                  <div className="resColumnCardsInner">
                    <AnimatePresence mode="popLayout">
                      {getReservationsByStage("reviewing").length === 0 ? (
                        <div className="resColumnEmpty">
                          <p>No reviewed leads</p>
                        </div>
                      ) : (
                        getReservationsByStage("reviewing").map((r) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: "100%" }}
                          >
                            <PipelineCard
                              reservation={r}
                              tablesList={tablesList}
                              canManage={canManage}
                              onConfirm={handleConfirmReservation}
                              onDecline={handleStageChange}
                              onStageChange={handleStageChange}
                              onCheckIn={handleCheckIn}
                              onSaveNote={handleSaveNote}
                              allReservations={reservations}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Column 3: Confirmed */}
              <div className={`resBoardColumn ${isMobile && expandedColumn === "accepted" ? "resColumnExpanded" : ""}`}>
                <div 
                  className="resColumnHeader borderConfirmed"
                  onClick={() => isMobile && toggleColumn("accepted")}
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isMobile && (
                      <span className="resColumnArrow">
                        ▶
                      </span>
                    )}
                    <h3>CONFIRMED ARRIVALS</h3>
                  </div>
                  <span className="resColumnBadge">{stats.accepted || 0}</span>
                </div>
                
                <motion.div 
                  initial={isMobile ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                  animate={
                    !isMobile || expandedColumn === "accepted"
                      ? { height: "auto", opacity: 1, display: "flex" }
                      : { height: 0, opacity: 0, transitionEnd: { display: "none" } }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="resColumnCards"
                >
                  <div className="resColumnCardsInner">
                    <AnimatePresence mode="popLayout">
                      {getReservationsByStage("accepted").length === 0 ? (
                        <div className="resColumnEmpty">
                          <p>No confirmed arrivals</p>
                        </div>
                      ) : (
                        getReservationsByStage("accepted").map((r) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: "100%" }}
                          >
                            <PipelineCard
                              reservation={r}
                              tablesList={tablesList}
                              canManage={canManage}
                              onConfirm={handleConfirmReservation}
                              onDecline={handleStageChange}
                              onStageChange={handleStageChange}
                              onCheckIn={handleCheckIn}
                              onSaveNote={handleSaveNote}
                              allReservations={reservations}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <>
              {/* History Column 1: Seated / Completed */}
              <div className={`resBoardColumn ${isMobile && expandedColumn === "completed" ? "resColumnExpanded" : ""}`}>
                <div 
                  className="resColumnHeader borderConfirmed"
                  onClick={() => isMobile && toggleColumn("completed")}
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isMobile && (
                      <span className="resColumnArrow">
                        ▶
                      </span>
                    )}
                    <h3>CHECKED IN / SEATED</h3>
                  </div>
                  <span className="resColumnBadge">{stats.completed || 0}</span>
                </div>
                
                <motion.div 
                  initial={isMobile ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                  animate={
                    !isMobile || expandedColumn === "completed"
                      ? { height: "auto", opacity: 1, display: "flex" }
                      : { height: 0, opacity: 0, transitionEnd: { display: "none" } }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="resColumnCards"
                >
                  <div className="resColumnCardsInner">
                    <AnimatePresence mode="popLayout">
                      {getReservationsByStage("completed").length === 0 ? (
                        <div className="resColumnEmpty">
                          <p>No seated guests in history</p>
                        </div>
                      ) : (
                        getReservationsByStage("completed").map((r) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: "100%" }}
                          >
                            <PipelineCard
                              reservation={r}
                              tablesList={tablesList}
                              canManage={canManage}
                              onConfirm={handleConfirmReservation}
                              onDecline={handleStageChange}
                              onStageChange={handleStageChange}
                              onCheckIn={handleCheckIn}
                              onSaveNote={handleSaveNote}
                              allReservations={reservations}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* History Column 2: Declined */}
              <div className={`resBoardColumn ${isMobile && expandedColumn === "declined" ? "resColumnExpanded" : ""}`}>
                <div 
                  className="resColumnHeader borderDeclined"
                  onClick={() => isMobile && toggleColumn("declined")}
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isMobile && (
                      <span className="resColumnArrow">
                        ▶
                      </span>
                    )}
                    <h3>DECLINED LEADS</h3>
                  </div>
                  <span className="resColumnBadge">{stats.declined || 0}</span>
                </div>
                
                <motion.div 
                  initial={isMobile ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
                  animate={
                    !isMobile || expandedColumn === "declined"
                      ? { height: "auto", opacity: 1, display: "flex" }
                      : { height: 0, opacity: 0, transitionEnd: { display: "none" } }
                  }
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="resColumnCards"
                >
                  <div className="resColumnCardsInner">
                    <AnimatePresence mode="popLayout">
                      {getReservationsByStage("declined").length === 0 ? (
                        <div className="resColumnEmpty">
                          <p>No declined leads in history</p>
                        </div>
                      ) : (
                        getReservationsByStage("declined").map((r) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: "100%" }}
                          >
                            <PipelineCard
                              reservation={r}
                              tablesList={tablesList}
                              canManage={canManage}
                              onConfirm={handleConfirmReservation}
                              onDecline={handleStageChange}
                              onStageChange={handleStageChange}
                              onCheckIn={handleCheckIn}
                              onSaveNote={handleSaveNote}
                              allReservations={reservations}
                            />
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}