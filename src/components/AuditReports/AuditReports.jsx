import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { auditApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AuditReports.css";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "custom", label: "Custom" },
];

const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function AuditReports() {
  const { can } = useAuth();
  const [range, setRange] = useState("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const showCustomDates = range === "custom";

  const loadReport = async () => {
    if (showCustomDates && (!from || !to)) {
      setError("Select both start and end date for custom range.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await auditApi.getReport({ range, from, to });
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load audit report. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const totals = useMemo(() => {
    if (!report) return { gross: 0, net: 0, tax: 0, discount: 0 };
    return {
      gross: report.summary?.gross || 0,
      net: report.summary?.net || 0,
      tax: report.summary?.tax || 0,
      discount: report.summary?.discount || 0,
    };
  }, [report]);

  const channelEntries = useMemo(() => {
    if (!report?.channels) return [];
    return Object.entries(report.channels)
      .map(([channel, value]) => ({ channel, value }))
      .sort((a, b) => b.value - a.value);
  }, [report]);

  const paymentEntries = useMemo(() => {
    if (!report?.payments) return [];
    return Object.entries(report.payments)
      .map(([method, value]) => ({ method, value }))
      .sort((a, b) => b.value - a.value);
  }, [report]);

  const categoryEntries = useMemo(() => {
    if (!report?.categories) return [];
    return Object.entries(report.categories)
      .filter(([key]) => key !== "total")
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [report]);

  if (!can("audit_reports")) {
    return (
      <div className="emptyState">
        <span className="emptyStateIcon">🔐</span>
        <p className="emptyStateText">Audit access is restricted to authorized roles.</p>
      </div>
    );
  }

  return (
    <div className="auditReports">
      <div className="dashPanelHeader">
        <div>
          <h2 className="dashPanelTitle">Audit Reports</h2>
          <p className="dashPanelSub">
            Deep-dive into revenue, discounts, tax exposure, and aggregator performance.
          </p>
        </div>
        <div className="auditActions">
          <div className="rangeControls">
            <label className="rangeLabel">Range</label>
            <select
              className="rangeSelect"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              disabled={loading}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {showCustomDates && (
              <div className="customRange">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  max={to || undefined}
                  disabled={loading}
                />
                <span>to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  min={from || undefined}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <div className="actionButtons">
            <button className="btnSecondary" onClick={loadReport} disabled={loading}>
              Refresh
            </button>
            <button
              className="btnSecondary"
              onClick={() => auditApi.exportCsv(report)}
              disabled={!report || loading}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && <p className="auditError">{error}</p>}

      {loading ? (
        <div className="emptyState">
          <span className="emptyStateIcon">⌛</span>
          <p className="emptyStateText">Compiling audit report…</p>
        </div>
      ) : report ? (
        <div className="auditGrid">
          <motion.section className="auditCard auditSummary" layout>
            <header>
              <h3>Financial Summary</h3>
              <p>Including tax, discounts, and net settlement.</p>
            </header>
            <div className="summaryGrid">
              <div className="summaryTile">
                <span>Gross Revenue</span>
                <strong>{formatCurrency(totals.gross)}</strong>
              </div>
              <div className="summaryTile">
                <span>Net Collected</span>
                <strong>{formatCurrency(totals.net)}</strong>
              </div>
              <div className="summaryTile">
                <span>Total Discounts</span>
                <strong>{formatCurrency(totals.discount)}</strong>
              </div>
              <div className="summaryTile">
                <span>Tax Liability</span>
                <strong>{formatCurrency(totals.tax)}</strong>
              </div>
            </div>
          </motion.section>

          <motion.section className="auditCard auditBreakdown" layout>
            <header>
              <h3>Business Breakdown</h3>
              <p>Split by channel and payment instruments.</p>
            </header>
            <div className="breakdownColumns">
              <div>
                <h4>Channels</h4>
                <ul>
                  {channelEntries.map((entry) => (
                    <li key={entry.channel}>
                      <span>{entry.channel.replace("_", " ").toUpperCase()}</span>
                      <strong>{formatCurrency(entry.value)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Payment Mix</h4>
                <ul>
                  {paymentEntries.map((entry) => (
                    <li key={entry.method}>
                      <span>{entry.method.replace("_", " ").toUpperCase()}</span>
                      <strong>{formatCurrency(entry.value)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section className="auditCard auditCategories" layout>
            <header>
              <h3>Category Performance</h3>
              <p>Food vs bar vs desserts vs beverage contribution.</p>
            </header>
            <ul>
              {categoryEntries.map((entry) => (
                <li key={entry.category}>
                  <div className="categoryInfo">
                    <span>{entry.category}</span>
                    <span className="categoryBar">
                      <span
                        className="categoryFill"
                        style={{ width: `${Math.min(100, (entry.value / (report.categories.total || 1)) * 100)}%` }}
                      />
                    </span>
                  </div>
                  <strong>{formatCurrency(entry.value)}</strong>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section className="auditCard auditTimeline" layout>
            <header>
              <h3>Revenue Timeline</h3>
              <p>Daily gross vs net with discount exposure.</p>
            </header>
            <div className="timelineList">
              {report.timeline?.map((day) => (
                <div key={day.date} className="timelineRow">
                  <div>
                    <p className="timelineDate">{day.date}</p>
                    <p className="timelineMeta">Discounts {formatCurrency(day.discount)}</p>
                  </div>
                  <div className="timelineNumbers">
                    <span>Gross {formatCurrency(day.gross)}</span>
                    <span>Net {formatCurrency(day.net)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="auditCard auditTopItems" layout>
            <header>
              <h3>Top Performing Items</h3>
              <p>Best sellers by revenue across menu categories.</p>
            </header>
            <table className="itemsTable">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.items?.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.qty}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>
        </div>
      ) : (
        <div className="emptyState">
          <span className="emptyStateIcon">📉</span>
          <p className="emptyStateText">No financial data available for the selected range.</p>
        </div>
      )}
    </div>
  );
}
