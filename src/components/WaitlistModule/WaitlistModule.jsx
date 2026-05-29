import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { waitlistApi, tablesApi } from "../../services/api";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "./WaitlistModule.css";

function elapsed(waitStart) {
  const mins = Math.floor((Date.now() - new Date(waitStart)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function WaitTimer({ waitStart }) {
  const [display, setDisplay] = useState(elapsed(waitStart));
  const mins = Math.floor((Date.now() - new Date(waitStart)) / 60000);
  useEffect(() => {
    const id = setInterval(() => setDisplay(elapsed(waitStart)), 30000);
    return () => clearInterval(id);
  }, [waitStart]);

  let cls = "waitTimer";
  if (mins >= 45) cls += " timerUrgent";
  else if (mins >= 20) cls += " timerWarn";
  return <span className={cls}>{display} wait</span>;
}

const SOURCE_LABELS = { WALK_IN: "Walk-in", PHONE: "Phone", WEBSITE: "Website", HOST_STAND: "Host Stand" };

const DECLINE_REASONS = [
  "Full capacity", "Long wait", "Large party", "VIP priority", "Closing soon",
];

function AddWalkInDrawer({ onClose, onAdd }) {
  const [form, setForm] = useState({
    guestName: "", partySize: 2, source: "WALK_IN",
    phone: "", notes: "", isVip: false, sectionPreference: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.guestName || !form.partySize) return;
    setSaving(true);
    try {
      await waitlistApi.add(form);
      onAdd();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <motion.div className="drawer" onClick={(e) => e.stopPropagation()}
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <div className="drawerHeader">
          <h2 className="drawerTitle">Add Walk-In</h2>
          <button className="drawerClose" onClick={onClose}>✕</button>
        </div>

        <div className="formGroup">
          <label className="formLabel">GUEST NAME</label>
          <input className="formInput" placeholder="Guest name" value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
        </div>

        <div className="formGroup">
          <label className="formLabel">PARTY SIZE</label>
          <div className="stepper">
            <button className="stepperBtn" type="button"
              onClick={() => setForm({ ...form, partySize: Math.max(1, form.partySize - 1) })}>−</button>
            <span className="stepperValue">{form.partySize}</span>
            <button className="stepperBtn" type="button"
              onClick={() => setForm({ ...form, partySize: form.partySize + 1 })}>+</button>
          </div>
        </div>

        <div className="formGroup">
          <label className="formLabel">SOURCE</label>
          <div className="chipGroup">
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <button key={v} type="button" className={`chip ${form.source === v ? "selected" : ""}`}
                onClick={() => setForm({ ...form, source: v })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="formGroup">
          <label className="formLabel">PHONE (OPTIONAL)</label>
          <input className="formInput" placeholder="+91 XXXXXXXXXX" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="formGroup">
          <label className="formLabel">SECTION PREFERENCE</label>
          <select className="formSelect" value={form.sectionPreference}
            onChange={(e) => setForm({ ...form, sectionPreference: e.target.value })}>
            <option value="">No preference</option>
            <option value="Indoor">Indoor</option>
            <option value="Terrace">Terrace</option>
            <option value="Garden">Garden</option>
            <option value="Bar">Bar</option>
          </select>
        </div>

        <div className="formGroup">
          <div className="toggleSwitch" onClick={() => setForm({ ...form, isVip: !form.isVip })}>
            <div className={`toggleTrack ${form.isVip ? "on" : ""}`}><div className="toggleThumb" /></div>
            <span className="formLabel">VIP Guest</span>
          </div>
        </div>

        <div className="formGroup">
          <label className="formLabel">NOTES</label>
          <textarea className="formTextarea" placeholder="Any special notes..." value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button className="btnPrimary" style={{ marginTop: "0.5rem" }} onClick={handleSubmit} disabled={saving || !form.guestName}>
          {saving ? "ADDING..." : "ADD TO QUEUE"}
        </button>
      </motion.div>
    </div>
  );
}

function DeclineDrawer({ entry, onClose, onDecline }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const handleDecline = async () => {
    setSaving(true);
    try {
      await waitlistApi.decline(entry._id, {
        reason: reason === "Custom" ? custom : reason,
        performer: { name: user?.name, role: user?.role },
      });
      onDecline();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <motion.div className="drawer" onClick={(e) => e.stopPropagation()}
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <div className="drawerHeader">
          <div>
            <h2 className="drawerTitle">Decline Guest</h2>
            <p className="dashPanelSub">{entry.guestName} · {entry.partySize} pax</p>
          </div>
          <button className="drawerClose" onClick={onClose}>✕</button>
        </div>

        <div className="formGroup">
          <label className="formLabel">REASON</label>
          <div className="chipGroup">
            {[...DECLINE_REASONS, "Custom"].map((r) => (
              <button key={r} type="button" className={`chip ${reason === r ? "selected" : ""}`}
                onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
        </div>

        {reason === "Custom" && (
          <div className="formGroup">
            <label className="formLabel">CUSTOM REASON</label>
            <input className="formInput" placeholder="Enter reason..." value={custom}
              onChange={(e) => setCustom(e.target.value)} />
          </div>
        )}

        <button className="btnDanger" style={{ marginTop: "1rem" }}
          onClick={handleDecline} disabled={saving || !reason || (reason === "Custom" && !custom)}>
          {saving ? "DECLINING..." : "CONFIRM DECLINE"}
        </button>
      </motion.div>
    </div>
  );
}

function SmartMatcher({ entry, availableTables, onAssign }) {
  const { user } = useAuth();
  const [assigning, setAssigning] = useState(null);

  const scored = availableTables
    .map((t) => {
      let score = 0;
      const reasons = [];
      if (t.pax >= entry.partySize) { score += 3; reasons.push("Fits party size"); }
      if (t.pax === entry.partySize) { score += 2; reasons.push("Exact fit"); }
      if (entry.sectionPreference && t.section === entry.sectionPreference) { score += 4; reasons.push("Preferred section"); }
      if (entry.isVip && t.section === "Terrace") { score += 1; reasons.push("VIP-friendly"); }
      return { ...t, score, reasons };
    })
    .filter((t) => t.pax >= entry.partySize)
    .sort((a, b) => b.score - a.score);

  const handleAssign = async (table) => {
    setAssigning(table.tableId);
    try {
      await tablesApi.updateStatus(table.tableId, {
        status: "seated",
        guest: entry.guestName,
        isVip: entry.isVip,
        performer: { name: user?.name, role: user?.role },
      });
      await waitlistApi.remove(entry._id);
      onAssign();
    } catch (e) { console.error(e); }
    finally { setAssigning(null); }
  };

  if (scored.length === 0) {
    return (
      <div className="smartMatcher">
        <p className="smTitle">SMART MATCHER</p>
        <div className="emptyState" style={{ padding: "1.5rem" }}>
          <span className="emptyStateIcon">🔍</span>
          <p className="emptyStateText">No available tables for {entry.partySize} pax</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smartMatcher">
      <p className="smTitle">SMART MATCHER</p>
      <p className="smSub">Best tables for {entry.guestName} ({entry.partySize} pax)</p>
      <div className="smTableList">
        {scored.map((t, i) => (
          <div key={t.tableId} className={`smTableRow ${i === 0 ? "smBestMatch" : ""}`}>
            <div>
              <div className="smTableHead">
                <span className="smTableId">{t.tableId}</span>
                {i === 0 && <span className="smBestBadge">Best Match</span>}
              </div>
              <p className="smTableMeta">{t.section} · {t.pax} pax</p>
              <div className="chipGroup" style={{ marginTop: "4px" }}>
                {t.reasons.map((r) => (
                  <span key={r} className="chip" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>{r}</span>
                ))}
              </div>
            </div>
            <button className="btnPrimary" style={{ fontSize: "0.62rem", padding: "0.4rem 0.75rem" }}
              onClick={() => handleAssign(t)} disabled={assigning === t.tableId}>
              {assigning === t.tableId ? "..." : "Assign →"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WaitlistModule() {
  const { can } = useAuth();
  const [queue, setQueue] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [declineEntry, setDeclineEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const [queueRes, tablesRes] = await Promise.all([
        waitlistApi.getAll(),
        tablesApi.getAll({ status: "available" }),
      ]);
      setQueue(queueRes.data);
      setAvailableTables(tablesRes.data.filter((t) => t.status === "available"));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchQueue();

    socket.on("waitlist:added", (entry) => {
      setQueue((prev) => {
        const exists = prev.some((e) => e._id === entry._id);
        if (exists) return prev;
        return [entry, ...prev];
      });
    });
    socket.on("waitlist:updated", (entry) => {
      setQueue((prev) => prev.map((e) => (e._id === entry._id ? entry : e)));
    });
    socket.on("waitlist:removed", (id) => {
      setQueue((prev) => prev.filter((e) => e._id !== id));
      setSelectedEntry((prev) => (prev?._id === id ? null : prev));
    });
    socket.on("table:statusChanged", fetchQueue);

    return () => {
      socket.off("waitlist:added");
      socket.off("waitlist:updated");
      socket.off("waitlist:removed");
      socket.off("table:statusChanged");
    };
  }, [fetchQueue]);

  const handleNotify = async (entry) => {
    try {
      await waitlistApi.notify(entry._id);
      fetchQueue();
    } catch (e) { console.error(e); }
  };

  const avgWait = queue.length > 0
    ? Math.round(queue.reduce((s, e) => s + Math.floor((Date.now() - new Date(e.waitStart)) / 60000), 0) / queue.length)
    : 0;

  const longestWait = queue.length > 0
    ? Math.max(...queue.map((e) => Math.floor((Date.now() - new Date(e.waitStart)) / 60000)))
    : 0;

  return (
    <div className="waitlistPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Waitlist & Queue</h2>
          <p className="dashPanelSub">{queue.length} parties waiting · {availableTables.length} tables available</p>
        </div>
        {can("waitlist_manage") && (
          <button className="btnPrimary" onClick={() => setShowAddDrawer(true)}>+ Add Walk-In</button>
        )}
      </div>

      {queue.length > 8 && (
        <div className="capacityWarning">
          ⚠ Queue over capacity — {queue.length} parties waiting. Prioritise bussing.
        </div>
      )}

      <div className="statsBar">
        <div className="statChip"><span className="statChipValue">{queue.length}</span><span className="statChipLabel">IN QUEUE</span></div>
        <div className="statChip"><span className="statChipValue">{avgWait}m</span><span className="statChipLabel">AVG WAIT</span></div>
        <div className="statChip"><span className="statChipValue">{longestWait}m</span><span className="statChipLabel">LONGEST WAIT</span></div>
        <div className="statChip"><span className="statChipValue">{availableTables.length}</span><span className="statChipLabel">AVAILABLE TABLES</span></div>
      </div>

      <div className="waitlistLayout">
        <div className="waitlistQueue">
          {loading && <div className="emptyState"><p className="emptyStateText">Loading queue...</p></div>}
          {!loading && queue.length === 0 && (
            <div className="emptyState">
              <span className="emptyStateIcon">≡</span>
              <p className="emptyStateText">No guests in queue</p>
            </div>
          )}
          <AnimatePresence>
            {queue.map((entry, idx) => {
              const isSelected = selectedEntry?._id === entry._id;
              return (
                <motion.div
                  key={entry._id}
                  className={`waitCard ${isSelected ? "selected" : ""} ${entry.isVip ? "vip" : ""} source-${entry.source}`}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  onClick={() => setSelectedEntry(isSelected ? null : entry)}
                >
                  <div className="waitCardLeft">
                    <span className="waitCardPos">#{idx + 1}</span>
                    <div className="waitCardInfo">
                      <div className="waitCardNameRow">
                        {entry.isVip && <span className="vipBadge">★</span>}
                        <span className="waitCardName">{entry.guestName}</span>
                        <span className="waitCardPax">· {entry.partySize} pax</span>
                      </div>
                      <div className="waitCardMeta">
                        <span className="sourceBadge source-{entry.source}">{SOURCE_LABELS[entry.source] || entry.source}</span>
                        {entry.sectionPreference && <span className="sectionPref">{entry.sectionPreference}</span>}
                        <WaitTimer waitStart={entry.waitStart} />
                      </div>
                      {entry.notes && <p className="waitCardNotes">{entry.notes}</p>}
                    </div>
                  </div>

                  {can("waitlist_manage") && (
                    <div className="waitCardActions" onClick={(e) => e.stopPropagation()}>
                      <button className="wcBtn wcNotify"
                        onClick={() => handleNotify(entry)}
                        title="Notify guest">🔔</button>
                      <button className="wcBtn wcDecline"
                        onClick={() => setDeclineEntry(entry)}
                        title="Decline">✕</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="waitlistRight">
          {selectedEntry ? (
            <SmartMatcher
              entry={selectedEntry}
              availableTables={availableTables}
              onAssign={() => { fetchQueue(); setSelectedEntry(null); }}
            />
          ) : (
            <div className="smPlaceholder">
              <span className="emptyStateIcon">🎯</span>
              <p className="emptyStateText">Select a guest to see matching tables</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddDrawer && (
          <AddWalkInDrawer onClose={() => setShowAddDrawer(false)} onAdd={fetchQueue} />
        )}
        {declineEntry && (
          <DeclineDrawer
            entry={declineEntry}
            onClose={() => setDeclineEntry(null)}
            onDecline={() => { fetchQueue(); setSelectedEntry(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
