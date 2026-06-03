import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  auditApi,
  insightsApi,
  tablesApi,
  reservationsApi,
  waitlistApi,
  serviceApi,
  ordersApi,
} from "../services/api";
import { socket } from "../services/socket";
import "./OwnerGodView.css";

const STATUS_COLORS = {
  available: "#3a6b3a",
  occupied: "#c8852a",
  reserved: "#4A7AB5",
  needs_bussing: "#C04040",
};

const CHANNEL_COLORS = {
  dine_in: "#d4aa50",
  swiggy: "#4A7AB5",
  zomato: "#C04040",
  banquet: "#48B076",
  events: "#B07CC7",
  aggregator: "#8C7B6A",
};

const RESERVATION_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
];

const RESERVATION_FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "all", label: "All" },
];

const SERVICE_LABELS = {
  call_waiter: "Waiter",
  bill_request: "Bill",
};

const INSIGHT_ICONS = {
  revenue: "◈",
  floor: "≡",
  reservations: "⊙",
  product: "★",
};

const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatPercent = (value = 0) => `${Math.round(value)}%`;

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);

const minutesSince = (isoString) => {
  if (!isoString) return 0;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.max(0, Math.round(diff / 60000));
};

const formatDuration = (minutes) => {
  if (!minutes) return "Just seated";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isOccupied = (status) => status === "occupied" || status === "seated";

const buildTooltip = (table, order, service) => {
  const lines = [`Section: ${table.section}`];
  if (table.guest) lines.push(`Guest: ${table.guest}`);
  if (table.occupiedSince) lines.push(`Seated: ${formatDuration(minutesSince(table.occupiedSince))}`);
  if (order) lines.push(`Order: ${formatCurrency(order.total)} (${order.status})`);
  if (service) lines.push(`Service: ${SERVICE_LABELS[service.type] || service.type}`);
  return lines.join("\n");
};

export default function OwnerGodView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [services, setServices] = useState([]);

  const [insights, setInsights] = useState(null);
  const [sectionPerf, setSectionPerf] = useState([]);
  const [reservationStats, setReservationStats] = useState(null);
  const [auditReport, setAuditReport] = useState(null);

  const auditRange = "7d";
  const [reservationFilter, setReservationFilter] = useState("today");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsight, setActiveInsight] = useState(0);
  const [livePulse, setLivePulse] = useState(true);

  const refreshServices = useCallback(async () => {
    const res = await serviceApi.getAll();
    setServices(res.data);
  }, []);

  const refreshWaitlist = useCallback(async () => {
    const res = await waitlistApi.getAll();
    setWaitlist(res.data);
  }, []);

  const loadData = useCallback(
    async (range = auditRange) => {
      try {
        setError("");
        setLoading(true);
        const [
          tablesRes,
          ordersRes,
          reservationsRes,
          waitlistRes,
          servicesRes,
          insightsRes,
          sectionRes,
          reservationStatsRes,
          auditRes,
        ] = await Promise.all([
          tablesApi.getAll(),
          ordersApi.getAll(),
          reservationsApi.getAll(),
          waitlistApi.getAll(),
          serviceApi.getAll(),
          insightsApi.getToday(),
          insightsApi.getSectionPerf(),
          reservationsApi.getStats(),
          auditApi.getReport({ range }),
        ]);

        setTables(tablesRes.data);
        setOrders(ordersRes.data);
        setReservations(reservationsRes.data);
        setWaitlist(waitlistRes.data);
        setServices(servicesRes.data);
        setInsights(insightsRes.data);
        setSectionPerf(sectionRes.data);
        setReservationStats(reservationStatsRes.data);
        setAuditReport(auditRes.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load owner intelligence right now.");
      } finally {
        setLoading(false);
      }
    },
    [auditRange]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulse = setInterval(() => setLivePulse((prev) => !prev), 1000);
    return () => clearInterval(pulse);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 120000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshServices();
      refreshWaitlist();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshServices, refreshWaitlist]);

  useEffect(() => {
    const handleTableStatus = (updated) => {
      setTables((prev) =>
        prev.map((table) => (table.tableId === updated.tableId ? { ...table, ...updated } : table))
      );
    };
    const handleServiceNew = (payload) => {
      setServices((prev) => [payload, ...prev]);
    };

    socket?.on("table:statusChanged", handleTableStatus);
    socket?.on("service:new", handleServiceNew);

    return () => {
      socket?.off("table:statusChanged", handleTableStatus);
      socket?.off("service:new", handleServiceNew);
    };
  }, []);

  useEffect(() => {
    const revenueInterval = setInterval(async () => {
      const res = await auditApi.getReport({ range: auditRange });
      setAuditReport(res.data);
    }, 180000);
    return () => clearInterval(revenueInterval);
  }, [auditRange]);

  const timeline = auditReport?.timeline || [];
  const lastGross = timeline[timeline.length - 1]?.gross || 0;
  const prevGross = timeline[timeline.length - 2]?.gross;

  const occupiedCount = tables.filter((t) => isOccupied(t.status)).length;
  const totalTables = tables.length || 1;
  const occupancyPct = Math.round((occupiedCount / totalTables) * 100);

  const kpiCards = useMemo(() => {
    const avgSpend = insights?.avgSpend || 0;
    const covers = insights?.covers || 0;
    const newRes = reservationStats?.newLeads || 0;
    const confirmed = reservationStats?.confirmed || 0;
    const revenueToday = lastGross || insights?.revenue || 0;

    const trends = {
      revenue: prevGross !== undefined ? (revenueToday >= prevGross ? "up" : "down") : "steady",
      occupancy: occupancyPct >= 70 ? "up" : occupancyPct <= 40 ? "down" : "steady",
      spend: avgSpend >= 1500 ? "up" : avgSpend <= 900 ? "down" : "steady",
      reservations: confirmed >= newRes ? "up" : newRes > confirmed * 1.5 ? "down" : "steady",
      covers: covers >= 40 ? "up" : covers <= 20 ? "down" : "steady",
    };

    const toneFor = (trend) => {
      if (trend === "up") return "good";
      if (trend === "down") return "alert";
      return "watch";
    };

    const iconFor = (trend) => {
      if (trend === "up") return "▲";
      if (trend === "down") return "▼";
      return "◆";
    };

    return [
      {
        key: "revenue",
        label: "REVENUE TODAY",
        value: formatCurrency(revenueToday),
        subtext:
          prevGross !== undefined
            ? `vs. yesterday ${formatCurrency(prevGross)}`
            : "tracking live",
        trend: iconFor(trends.revenue),
        tone: toneFor(trends.revenue),
      },
      {
        key: "occupancy",
        label: "OCCUPANCY",
        value: `${occupiedCount}/${totalTables} tables`,
        subtext: `${formatPercent(occupancyPct)} occupied`,
        trend: iconFor(trends.occupancy),
        tone: toneFor(trends.occupancy),
      },
      {
        key: "avgSpend",
        label: "AVG SPEND",
        value: formatCurrency(avgSpend),
        subtext: "per cover",
        trend: iconFor(trends.spend),
        tone: toneFor(trends.spend),
      },
      {
        key: "newReservations",
        label: "NEW RESERVATIONS",
        value: newRes,
        subtext: `${confirmed} confirmed`,
        trend: iconFor(trends.reservations),
        tone: toneFor(trends.reservations),
      },
      {
        key: "covers",
        label: "COVERS SEATED",
        value: covers,
        subtext: "active right now",
        trend: iconFor(trends.covers),
        tone: toneFor(trends.covers),
      },
    ];
  }, [insights, reservationStats, lastGross, prevGross, occupancyPct, occupiedCount, totalTables]);

  const tablesBySection = useMemo(() => {
    return tables.reduce((acc, table) => {
      const section = table.section || "Other";
      if (!acc[section]) acc[section] = { total: 0, occupied: 0 };
      acc[section].total += 1;
      if (isOccupied(table.status)) acc[section].occupied += 1;
      return acc;
    }, {});
  }, [tables]);

  const sectionSummary = useMemo(() =>
    Object.entries(tablesBySection).map(([section, data]) => ({
      section,
      total: data.total,
      occupied: data.occupied,
      percent: data.total ? Math.round((data.occupied / data.total) * 100) : 0,
    })),
  [tablesBySection]);

  const longSeated = tables.filter(
    (t) => isOccupied(t.status) && minutesSince(t.occupiedSince) > 90
  ).length;

  const terraceSummary = sectionSummary.find((s) => s.section === "Terrace");

  const floorInsight = useMemo(() => {
    if (terraceSummary && terraceSummary.occupied === terraceSummary.total && terraceSummary.total) {
      return "Terrace is at 100% — consider opening overflow seating.";
    }
    if (longSeated > 0) {
      return `${longSeated} tables have been seated over 90 min — turnover opportunity.`;
    }
    return "All sections balanced — maintain current pacing.";
  }, [terraceSummary, longSeated]);

  const filteredReservations = useMemo(() => {
    if (!reservations.length) return [];
    const today = new Date();
    return reservations.filter((reservation) => {
      const resDate = reservation.date ? new Date(reservation.date) : null;
      if (!resDate) return true;
      switch (reservationFilter) {
        case "today":
          return resDate.toDateString() === today.toDateString();
        case "week": {
          const diff = resDate - today;
          return diff <= 6 * 86400000 && diff >= -1 * 86400000;
        }
        default:
          return true;
      }
    });
  }, [reservations, reservationFilter]);

  const reservationsByStage = useMemo(() => {
    return RESERVATION_STAGES.map(({ key, label }) => ({
      key,
      label,
      items: filteredReservations.filter((reservation) => reservation.stage === key),
    }));
  }, [filteredReservations]);

  const pendingLeads = filteredReservations.filter((reservation) =>
    reservation.stage === "new" && minutesSince(reservation.createdAt) > 120
  ).length;

  const conversionRate = useMemo(() => {
    const total = reservationStats?.total || filteredReservations.length || 0;
    if (!total) return 0;
    const confirmed = reservationStats?.confirmed || filteredReservations.filter((r) => r.stage === "confirmed" || r.stage === "checked_in").length;
    return Math.round((confirmed / total) * 100);
  }, [reservationStats, filteredReservations]);

  const revenueTimeline = useMemo(() => {
    if (!timeline.length) return { points: "", maxGross: 0 };
    const maxGross = Math.max(...timeline.map((day) => day.gross));
    const points = timeline
      .map((day, index) => {
        const x = timeline.length === 1 ? 0 : (index / (timeline.length - 1)) * 100;
        const y = maxGross ? 100 - (day.gross / maxGross) * 100 : 100;
        return `${x},${y}`;
      })
      .join(" ");
    return { points, maxGross };
  }, [timeline]);

  const channelBreakdown = useMemo(() => {
    const entries = Object.entries(auditReport?.channels || {});
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (!total) return [];
    let cursor = 0;
    return entries.map(([channel, value]) => {
      const fraction = (value / total) * 360;
      const segment = { color: CHANNEL_COLORS[channel] || "#8C7B6A", value: fraction };
      cursor += fraction;
      return { channel, percent: Math.round((value / total) * 100), segment };
    });
  }, [auditReport]);

  const crowdStats = useMemo(() => {
    const vipTables = tables.filter((table) => table.isVip).length;
    const guestMixPercent = tables.length ? Math.round((vipTables / tables.length) * 100) : 0;

    const paxBuckets = { "1-2": 0, "3-4": 0, "5-8": 0, "9+": 0 };
    tables.forEach((table) => {
      if (table.pax <= 2) paxBuckets["1-2"] += 1;
      else if (table.pax <= 4) paxBuckets["3-4"] += 1;
      else if (table.pax <= 8) paxBuckets["5-8"] += 1;
      else paxBuckets["9+"] += 1;
    });

    const waitlistSections = waitlist.reduce((acc, entry) => {
      const section = entry.sectionPreference || "Any";
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    const waitlistSources = waitlist.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1;
      return acc;
    }, {});

    const totalWait = waitlist.length || 1;

    return {
      guestMixPercent,
      vipTables,
      paxBuckets,
      waitlistSections,
      waitlistSources,
      totalWait,
    };
  }, [tables, waitlist]);

  const waitlistPulse = useMemo(() => {
    const total = waitlist.length;
    const oldest = waitlist.reduce((max, entry) => {
      const mins = minutesSince(entry.waitStart);
      return Math.max(max, mins);
    }, 0);
    const avg = total
      ? Math.round(waitlist.reduce((sum, entry) => sum + minutesSince(entry.waitStart), 0) / total)
      : 0;
    return { total, oldest, avg };
  }, [waitlist]);

  const newServiceAlerts = services.filter((service) => service.status === "new");

  const topItem = insights?.topItems?.[0];
  const availableTables = tables.filter((table) => table.status === "available").length;

  const insightsList = useMemo(() => {
    const list = [];
    if (auditReport?.summary) {
      const target = 60000;
      const progress = Math.round((auditReport.summary.gross / target) * 100);
      list.push({
        key: "revenue",
        icon: INSIGHT_ICONS.revenue,
        text: `${formatCurrency(auditReport.summary.gross)} tracked — you are ${progress}% toward the daily target of ${formatCurrency(target)}.`,
      });
    }
    if (waitlistPulse.total) {
      list.push({
        key: "floor",
        icon: INSIGHT_ICONS.floor,
        text: `${waitlistPulse.total} guests waiting — ${availableTables} tables free — immediate seating possible.`,
      });
    }
    if (topItem) {
      list.push({
        key: "product",
        icon: INSIGHT_ICONS.product,
        text: `${topItem.name} is leading orders with ${topItem.count || topItem.qty || 0} serves so far.`,
      });
    }
    list.push({
      key: "reservations",
      icon: INSIGHT_ICONS.reservations,
      text: `Reservation pipeline conversion at ${conversionRate}% — ${pendingLeads} new leads pending follow-up.`,
    });
    return list;
  }, [auditReport, waitlistPulse, availableTables, topItem, conversionRate, pendingLeads]);

  useEffect(() => {
    if (!insightsList.length) return undefined;
    const ticker = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insightsList.length);
    }, 6000);
    return () => clearInterval(ticker);
  }, [insightsList]);

  const currentInsight = insightsList[activeInsight] || null;
  const highlightInsights = useMemo(() => insightsList.slice(0, 4), [insightsList]);

  const serviceFeed = useMemo(
    () =>
      newServiceAlerts
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [newServiceAlerts]
  );

  return (
    <div className="ownerGodView">
      <header className="godHeader">
        <div className="godHeaderTitle">
          <span className="godBadge">GOD VIEW</span>
          <div>
            <h1>Basque</h1>
            <p>Executive Intelligence Console</p>
          </div>
        </div>
        <div className="godHeaderMeta">
          <div className="godClock">
            <span className={`liveDot ${livePulse ? "is-on" : ""}`} />
            <span>Live</span>
          </div>
          <div className="godTimestamp">
            <span>{formatDate(currentTime)}</span>
            <strong>{formatTime(currentTime)}</strong>
          </div>
        </div>
      </header>

      {error && <div className="godError">{error}</div>}

      <section className="kpiStrip">
        {kpiCards.map((card) => (
          <motion.article
            key={card.key}
            className={`godKpi ${card.tone}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="kpiLabel">{card.label}</div>
            <div className="kpiValue">{card.value}</div>
            <div className="kpiMeta">
              <span className="kpiTrend">{card.trend}</span>
              <span className="kpiSub">{card.subtext}</span>
            </div>
          </motion.article>
        ))}
      </section>

      <motion.section className="godPanel importantInsights" layout>
        <header className="panelHeader">
          <div>
            <h2>Important Insights</h2>
            <p>High-signal movements Avantika should know</p>
          </div>
        </header>
        <div className="insightHighlightGrid">
          {highlightInsights.length ? (
            highlightInsights.map((insight) => (
              <div key={insight.key} className="insightHighlightCard">
                <span className="insightHighlightIcon">{insight.icon}</span>
                <p>{insight.text}</p>
              </div>
            ))
          ) : (
            <p className="insightHighlightEmpty">Intelligence syncing… no major movements yet.</p>
          )}
        </div>
      </motion.section>

      <div className="godRow twoColumn">
        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Floor Overview</h2>
              <p>Live table status and section load</p>
            </div>
          </header>

          <div className="sectionMiniBars">
            {sectionSummary.map((section) => (
              <div key={section.section} className="miniBarItem">
                <span>{section.section}</span>
                <div className="miniBarTrack">
                  <div
                    className="miniBarFill"
                    style={{ width: `${clamp(section.percent, 0, 100)}%` }}
                  />
                </div>
                <span className="miniBarMeta">
                  {section.occupied}/{section.total}
                </span>
              </div>
            ))}
          </div>

          <div className="tableGrid">
            {tables.map((table) => {
              const order = orders.find(
                (o) => o.tableId === table.tableId && o.status !== "served"
              );
              const service = services.find(
                (s) => s.tableId === table.tableId && s.status === "new"
              );
              const statusKey = isOccupied(table.status) ? "occupied" : table.status;
              return (
                <div
                  key={table.tableId}
                  className={`tableChip status-${statusKey}`}
                  data-tooltip={buildTooltip(table, order, service)}
                >
                  <span className="chipName">{table.tableName}</span>
                  {service && <span className="chipAlert">!</span>}
                </div>
              );
            })}
          </div>

          <footer className="panelFooter">
            <span>{floorInsight}</span>
          </footer>
        </motion.section>

        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Reservation Pipeline</h2>
              <p>Lead progression across touchpoints</p>
            </div>
            <div className="panelToggles">
              {RESERVATION_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  className={filter.key === reservationFilter ? "active" : ""}
                  onClick={() => setReservationFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </header>

          <div className="pipelineWrap">
            {reservationsByStage.map((column) => (
              <div key={column.key} className="pipelineColumn">
                <div className="pipelineHeader">
                  <span>{column.label}</span>
                  <span className="pipelineCount">{column.items.length}</span>
                </div>
                <div className="pipelineList">
                  {column.items.map((item) => (
                    <div key={item._id} className="pipelineCard">
                      <strong>{item.name}</strong>
                      <div className="pipelineMeta">
                        <span>{item.service?.toUpperCase?.() || item.service}</span>
                        <span>
                          {item.guests || item.participants || item.partySize || item.covers || 0} guests • {item.date}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!column.items.length && <p className="emptyColumn">No {column.label.toLowerCase()} items.</p>}
                </div>
              </div>
            ))}
          </div>

          <footer className="panelFooter">
            <span>
              {pendingLeads
                ? `${pendingLeads} new leads pending contact for over 2 hours.`
                : "All new leads touched within SLA."}
            </span>
            <span>Conversion rate {conversionRate}% — industry average 60%.</span>
          </footer>
        </motion.section>
      </div>

      <div className="godRow twoColumn">
        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Crowd Intelligence</h2>
              <p>Who is dining and how they arrived</p>
            </div>
          </header>

          <div className="crowdStats">
            <div className="miniStat">
              <div className="miniStatLabel">Guest Mix</div>
              <div className="miniBarTrack">
                <div
                  className="miniBarFill vip"
                  style={{ width: `${clamp(crowdStats.guestMixPercent, 0, 100)}%` }}
                />
              </div>
              <div className="miniStatMeta">
                <span>{crowdStats.vipTables} VIP tables</span>
                <span>{crowdStats.guestMixPercent}% of floor</span>
              </div>
            </div>

            <div className="miniStat">
              <div className="miniStatLabel">Party Size</div>
              <div className="miniStack">
                {Object.entries(crowdStats.paxBuckets).map(([bucket, count]) => (
                  <div key={bucket}>
                    <span>{bucket}</span>
                    <div className="miniBarTrack">
                      <div
                        className="miniBarFill"
                        style={{
                          width: `${tables.length ? clamp((count / tables.length) * 100, 0, 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="miniBarMeta">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="miniStat">
              <div className="miniStatLabel">Section Preference</div>
              <div className="miniStack">
                {Object.entries(crowdStats.waitlistSections).map(([section, count]) => (
                  <div key={section}>
                    <span>{section}</span>
                    <div className="miniBarTrack">
                      <div
                        className="miniBarFill"
                        style={{
                          width: `${crowdStats.totalWait ? clamp((count / crowdStats.totalWait) * 100, 0, 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="miniBarMeta">{count}</span>
                  </div>
                ))}
                {!crowdStats.totalWait && <p className="emptyColumn">No waitlist preferences logged.</p>}
              </div>
            </div>

            <div className="miniStat">
              <div className="miniStatLabel">Booking Source</div>
              <div className="miniStack">
                {Object.entries(crowdStats.waitlistSources).map(([source, count]) => (
                  <div key={source}>
                    <span>{source.replace("_", " ")}</span>
                    <div className="miniBarTrack">
                      <div
                        className="miniBarFill"
                        style={{
                          width: `${crowdStats.totalWait ? clamp((count / crowdStats.totalWait) * 100, 0, 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="miniBarMeta">{count}</span>
                  </div>
                ))}
                {!crowdStats.totalWait && <p className="emptyColumn">No guest sources captured.</p>}
              </div>
            </div>
          </div>

          <footer className="panelFooter">
            <span>
              {crowdStats.totalWait
                ? `${Math.round((crowdStats.paxBuckets["1-2"] / (tables.length || 1)) * 100)}% couples tonight — promote set menus for two.`
                : "Guest mix steady with balanced demand."}
            </span>
          </footer>
        </motion.section>
      </div>

      <div className="godRow threeColumn">
        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Section Performance</h2>
              <p>Revenue & cover contribution</p>
            </div>
          </header>

          <div className="sectionPerf">
            {sectionPerf.map((section) => (
              <div key={section.section} className="sectionPerfRow">
                <div>
                  <strong>{section.section}</strong>
                  <span>{section.covers} covers</span>
                </div>
                <div className="sectionPerfBar">
                  <div
                    style={{ width: `${clamp(section.revenue / (lastGross || 1) * 100, 0, 100)}%` }}
                  />
                </div>
                <span className="sectionPerfRevenue">{formatCurrency(section.revenue)}</span>
              </div>
            ))}
            {!sectionPerf.length && <p className="emptyColumn">No section analytics available.</p>}
          </div>
        </motion.section>

        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Waitlist Pulse</h2>
              <p>Throughput & SLA monitoring</p>
            </div>
          </header>
          <div className="waitlistPulse">
            <div>
              <span>Total Waiting</span>
              <strong>{waitlistPulse.total}</strong>
            </div>
            <div>
              <span>Oldest Party</span>
              <strong>{waitlistPulse.oldest ? formatDuration(waitlistPulse.oldest) : "--"}</strong>
            </div>
            <div>
              <span>Avg. Wait</span>
              <strong>{waitlistPulse.avg ? formatDuration(waitlistPulse.avg) : "--"}</strong>
            </div>
          </div>
          <footer className="panelFooter">
            <span>
              {waitlistPulse.avg > 20
                ? `Average wait ${waitlistPulse.avg} minutes — consider pacing adjustments.`
                : "Wait times within promise."}
            </span>
          </footer>
        </motion.section>

        <motion.section className="godPanel" layout>
          <header className="panelHeader">
            <div>
              <h2>Service Alerts</h2>
              <p>Highest priority guest requests</p>
            </div>
          </header>
          <div className="serviceFeed">
            <AnimatePresence initial={false}>
              {serviceFeed.map((alert) => (
                <motion.div
                  key={alert._id}
                  className="serviceItem"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div>
                    <strong>{alert.tableName}</strong>
                    <span>{SERVICE_LABELS[alert.type] || alert.type}</span>
                  </div>
                  <span className="serviceTime">{formatDuration(minutesSince(alert.createdAt))} ago</span>
                </motion.div>
              ))}
              {!serviceFeed.length && <p className="emptyColumn">All guest calls resolved.</p>}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      <section className="godPanel aiBar" aria-live="polite">
        <AnimatePresence mode="wait">
          {currentInsight ? (
            <motion.div
              key={currentInsight.key + activeInsight}
              className="aiInsight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <span className="aiIcon">{currentInsight.icon}</span>
              <span>{currentInsight.text}</span>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              className="aiInsight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="aiIcon">◈</span>
              <span>Intelligence loading…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {loading && <div className="godLoading">Refreshing data…</div>}
    </div>
  );
}
