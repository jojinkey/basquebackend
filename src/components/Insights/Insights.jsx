import { useState, useEffect, useCallback } from "react";
import { insightsApi, reservationsApi } from "../../services/api";
import "./Insights.css";

function getService() {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return "BREAKFAST";
  if (h >= 12 && h < 16) return "LUNCH";
  if (h >= 16 && h < 19) return "HIGH TEA";
  return "DINNER";
}

export default function Insights() {
  const [today, setToday] = useState(null);
  const [sectionPerf, setSectionPerf] = useState([]);
  const [resStats, setResStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [todayRes, sectionRes, resStatsRes] = await Promise.all([
        insightsApi.getToday(),
        insightsApi.getSectionPerf(),
        reservationsApi.getStats(),
      ]);
      setToday(todayRes.data);
      setSectionPerf(sectionRes.data);
      setResStats(resStatsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <div className="emptyState"><p className="emptyStateText">Loading insights...</p></div>;
  }

  const totalSectionRevenue = sectionPerf.reduce((s, sec) => s + sec.revenue, 0);

  return (
    <div className="insightsPage">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Insights & Analytics</h2>
          <p className="dashPanelSub">Today's service overview</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className="serviceBadge">{getService()}</span>
          <button className="btnSecondary" onClick={fetchAll}>Refresh</button>
          <button className="btnSecondary" onClick={() => insightsApi.exportAudit()}>
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="insightKpiStrip">
        <div className="kpiCard">
          <span className="kpiValue">₹{today?.revenue?.toLocaleString() || "0"}</span>
          <span className="kpiLabel">TOTAL REVENUE</span>
        </div>
        <div className="kpiCard">
          <span className="kpiValue">{today?.covers || 0}</span>
          <span className="kpiLabel">COVERS SEATED</span>
        </div>
        <div className="kpiCard">
          <span className="kpiValue">₹{today?.avgSpend?.toLocaleString() || "0"}</span>
          <span className="kpiLabel">AVG SPEND</span>
        </div>
        <div className="kpiCard">
          <span className="kpiValue">{today?.orderCount || 0}</span>
          <span className="kpiLabel">TOTAL ORDERS</span>
        </div>
      </div>

      <div className="insightsGrid">
        {/* Top Items */}
        <div className="insightCard">
          <h3 className="insightCardTitle">TOP ITEMS TODAY</h3>
          {today?.topItems?.length > 0 ? (
            <div className="topItemsList">
              {today.topItems.map((item, i) => (
                <div key={item.name} className="topItemRow">
                  <div className="topItemRank">{i + 1}</div>
                  <div className="topItemInfo">
                    <p className="topItemName">{item.name}</p>
                    <div className="topItemBar">
                      <div
                        className="topItemBarFill"
                        style={{ width: `${(item.count / today.topItems[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="topItemCount">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="insightEmpty">No orders yet today</p>
          )}
        </div>

        {/* Section Performance */}
        <div className="insightCard">
          <h3 className="insightCardTitle">SECTION PERFORMANCE</h3>
          <div className="sectionPerfList">
            {sectionPerf.map((sec) => (
              <div key={sec.section} className="sectionPerfRow">
                <div className="sectionPerfLeft">
                  <span className="sectionPerfName">{sec.section}</span>
                  <span className="sectionPerfCovers">{sec.covers} seated</span>
                </div>
                <div className="sectionPerfRight">
                  <span className="sectionPerfRevenue">₹{sec.revenue.toLocaleString()}</span>
                  <div className="sectionPerfBarWrap">
                    <div
                      className="sectionPerfBar"
                      style={{ width: totalSectionRevenue > 0 ? `${(sec.revenue / totalSectionRevenue) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Funnel */}
        {resStats && (
          <div className="insightCard">
            <h3 className="insightCardTitle">RESERVATION FUNNEL</h3>
            <div className="funnelList">
              {[
                { label: "New Leads", value: resStats.newLeads, color: "#4A7AB5" },
                { label: "Contacted", value: resStats.contacted, color: "#C8852A" },
                { label: "Confirmed", value: resStats.confirmed, color: "#48B076" },
                { label: "Declined", value: resStats.declined, color: "#C04040" },
                { label: "Checked In", value: resStats.checkedIn, color: "#8C7B6A" },
              ].map((item) => (
                <div key={item.label} className="funnelRow">
                  <span className="funnelLabel">{item.label}</span>
                  <div className="funnelBarWrap">
                    <div
                      className="funnelBar"
                      style={{
                        width: resStats.total > 0 ? `${(item.value / resStats.total) * 100}%` : "0%",
                        background: item.color,
                      }}
                    />
                  </div>
                  <span className="funnelCount" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Recommendations */}
        <div className="insightCard">
          <h3 className="insightCardTitle">SERVICE RECOMMENDATIONS</h3>
          <div className="recList">
            {today?.covers === 0 && (
              <div className="recItem recInfo">
                <span className="recDot" style={{ background: "#4A7AB5" }} />
                <p>No tables currently seated — ready for service</p>
              </div>
            )}
            {today?.topItems?.[0] && (
              <div className="recItem recInfo">
                <span className="recDot" style={{ background: "#C8852A" }} />
                <p>{today.topItems[0].name} is the top item — ensure stock levels are sufficient</p>
              </div>
            )}
            {resStats?.newLeads > 0 && (
              <div className="recItem recWarn">
                <span className="recDot" style={{ background: "#C8852A" }} />
                <p>{resStats.newLeads} new reservation lead{resStats.newLeads > 1 ? "s" : ""} pending contact</p>
              </div>
            )}
            {today?.orderCount === 0 && (
              <div className="recItem recInfo">
                <span className="recDot" style={{ background: "#48B076" }} />
                <p>Kitchen is clear — ready for orders</p>
              </div>
            )}
            {today?.revenue > 0 && today?.covers > 0 && (
              <div className="recItem recGood">
                <span className="recDot" style={{ background: "#48B076" }} />
                <p>Average spend ₹{today.avgSpend?.toLocaleString()} per cover — on track</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
