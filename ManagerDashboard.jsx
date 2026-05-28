import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ManagerDashboard.css";

const API = "http://localhost:5000/api";

const NAV_ITEMS = [
  { id: "floor",    label: "Floor Plan",           icon: "⊞" },
  { id: "waitlist", label: "Waitlist",              icon: "≡" },
  { id: "courts",   label: "Courts",                icon: "△" },
  { id: "events",   label: "Events",                icon: "◇" },
  { id: "insights", label: "Insights & Analytics",  icon: "⊙" },
];

const SECTIONS = ["All", "Indoor", "Terrace", "Garden", "Bar"];

function fmtDur(m) {
  if (!m) return "";
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h ${min}m seated` : `${min}m seated`;
}

function fmtRev(v) {
  return v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`;
}

function cardClass(t) {
  if (t.status === "needs_bussing") return "tCard bussing";
  if (t.status === "seated" && t.isVip) return "tCard vip";
  if (t.status === "seated") return "tCard occupied";
  if (t.status === "reserved" && t.isVip) return "tCard reserved vip";
  if (t.status === "reserved") return "tCard reserved";
  return "tCard";
}

function ManagerDashboard() {
  const [tables,   setTables]   = useState([]);
  const [stats,    setStats]    = useState({});
  const [waitlist, setWaitlist] = useState([]);
  const [activeTab, setActiveTab] = useState("floor");
  const [section,  setSection]  = useState("All");
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchData = async () => {
    try {
      const [t, s, w] = await Promise.all([
        axios.get(`${API}/tables`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/waitlist`),
      ]);
      setTables(t.data);
      setStats(s.data);
      setWaitlist(w.data);
      setActivity(prev => [new Date().toLocaleTimeString(), ...prev].slice(0, 5));
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(
    () => section === "All" ? tables : tables.filter(t => t.section === section),
    [tables, section]
  );

  const exportLog = () => {
    const rows = ["ID,Section,Status,Guest,Duration,Reservation"]
      .concat(tables.map(t =>
        `${t.id},${t.section},${t.status},${t.guest || ""},${t.seatedDuration || ""},${t.reservation || ""}`
      )).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([rows], { type: "text/csv" })),
      download: "basque-audit-log.csv",
    });
    a.click();
  };

  return (
    <div className="mgPage">

      {/* ── Sidebar ── */}
      <aside className="mgSidebar">
        <div className="mgBrand">
          <h1>BASQUE</h1>
          <p>MANAGER OS</p>
        </div>

        <nav className="mgNav">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`mgNavBtn${activeTab === id ? " active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="navIcon">{icon}</span>
              {label}
              {id === "waitlist" && waitlist.length > 0 && (
                <span className="wBadge">{waitlist.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mgSidebarFoot">
          <p className="actLabel">Recent Activity</p>
          {activity.slice(0, 2).map((t, i) => (
            <p key={i} className="actTime">{t}</p>
          ))}
          <button className="exportBtn" onClick={exportLog}>
            Export Audit Log
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="mgMain">

        {/* Top stats bar */}
        <header className="mgTopBar">
          <div className="svcInfo">
            <span className="svcLabel">Current Service</span>
            <span className="svcTag">DINNER</span>
          </div>
          <div className="statsRow">
            {[
              { label: "AVAILABLE",    val: stats.available ?? 0,              cls: "blue" },
              { label: "SEATED",       val: stats.seated ?? 0,                 cls: "blue" },
              { label: "AVG DURATION", val: `${stats.avgDuration ?? 0}m`,      cls: "blue" },
              { label: "REVENUE",      val: fmtRev(stats.revenue ?? 0),        cls: "teak" },
              { label: "AVG SPEND",    val: `₹${stats.avgSpend ?? 0}`,         cls: "teak" },
              { label: "WAITLIST",     val: stats.waitlist ?? 0,               cls: "blue" },
            ].map(({ label, val, cls }) => (
              <div className="sStat" key={label}>
                <p className="sLabel">{label}</p>
                <p className={`sVal ${cls}`}>{val}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="mgBody">

          {/* ── Floor Plan ── */}
          {activeTab === "floor" && (
            <>
              <div className="secTabs">
                {SECTIONS.map(s => (
                  <button
                    key={s}
                    className={`secTab${section === s ? " active" : ""}`}
                    onClick={() => setSection(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="emptyMsg">Loading tables…</p>
              ) : (
                <div className="floorGrid">
                  {filtered.map(t => (
                    <div className={cardClass(t)} key={t.id}>
                      <div className="cTop">
                        <span className="cId">{t.id}</span>
                        <span className="cPax">{t.pax} Pax</span>
                      </div>

                      {(t.status === "seated" || t.status === "reserved") && (
                        <div className="cBody">
                          {t.isVip && <span className="star">★</span>}
                          <p className="cGuest">{t.guest}</p>
                          {t.seatedDuration && (
                            <p className="cDur">{fmtDur(t.seatedDuration)}</p>
                          )}
                          {t.reservation && (
                            <p className="cRes">Res: {t.reservation}</p>
                          )}
                        </div>
                      )}

                      {t.status === "needs_bussing" && (
                        <div className="cBody">
                          <p className="bussingTxt">Needs Bussing</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Insights ── */}
          {activeTab === "insights" && (
            <div className="insightsPanel">
              <h2 className="insTitle">Insights & Performance Analytics</h2>

              <div className="insCards">
                <div className="insCard">
                  <p className="insLbl">Total Revenue (Current Service)</p>
                  <h2 className="insVal teak">{fmtRev(stats.revenue ?? 0)}</h2>
                  <p className="insSub">Active Covers: {stats.activeCovers ?? 0}</p>
                </div>
                <div className="insCard">
                  <p className="insLbl">Avg Spend Per Cover</p>
                  <h2 className="insVal teak">₹{stats.avgSpend ?? 0}</h2>
                  <p className="insSub">Seated Tables: {stats.seated ?? 0}</p>
                </div>
                <div className="insCard">
                  <p className="insLbl">Tables Over Turn Time</p>
                  <h2 className="insVal dark">{stats.overTurnTime ?? 0}</h2>
                  <p className="insSub">Avg Duration: {stats.avgDuration ?? 0}m</p>
                </div>
                <div className="insCard highlight">
                  <p className="insLbl">Guests Waiting</p>
                  <h2 className="insVal dark">{stats.waitlist ?? 0}</h2>
                  <p className="insSub">Available Seats: {stats.available ?? 0}</p>
                </div>
              </div>

              <div className="recBox">
                <h3>Service Recommendations</h3>
                <ul>
                  {(stats.waitlist ?? 0) > 0 && (
                    <li>📋 {stats.waitlist} guest(s) waiting — prioritize table turnovers</li>
                  )}
                  {(stats.overTurnTime ?? 0) > 0 && (
                    <li>⏱ {stats.overTurnTime} table(s) over average turn time</li>
                  )}
                  {!(stats.waitlist > 0) && !(stats.overTurnTime > 0) && (
                    <li>✓ All tables within normal parameters</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* ── Waitlist ── */}
          {activeTab === "waitlist" && (
            <div className="insightsPanel">
              <h2 className="insTitle">Waitlist</h2>
              {waitlist.length === 0 ? (
                <p className="emptyMsg">No guests on waitlist.</p>
              ) : (
                <div className="wList">
                  {waitlist.map(w => (
                    <div className="wCard" key={w.id}>
                      <div>
                        <strong>{w.name}</strong>
                        <span className="wParty">{w.party} guests</span>
                      </div>
                      <span className="wTime">Waiting: {w.waitTime}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Courts / Events ── */}
          {(activeTab === "courts" || activeTab === "events") && (
            <div className="insightsPanel">
              <p className="emptyMsg">
                {activeTab === "courts" ? "Courts" : "Events"} — coming soon.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default ManagerDashboard;