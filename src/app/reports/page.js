"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Date filter state
  const [dateType, setDateType] = useState("today"); // 'all', 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState("");

  // Load report stats
  const fetchReports = async () => {
    setLoading(true);
    try {
      let dateParam = dateType;
      if (dateType === "custom") {
        dateParam = customDate;
      }

      const params = new URLSearchParams();
      if (dateParam && dateParam !== "all") params.append("date", dateParam);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("Error loading reports. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 0);
    return () => clearTimeout(timer);
  }, [dateType, customDate]);

  // Export handlers
  const handleExport = (type, format) => {
    let dateParam = dateType;
    if (dateType === "custom") {
      dateParam = customDate;
    }

    const params = new URLSearchParams();
    params.append("format", format);
    if (dateParam && dateParam !== "all") params.append("date", dateParam);

    // Redirect to export route
    window.location.href = `/api/export/${type}?${params.toString()}`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Sales Reports</h1>
        <button
          onClick={fetchReports}
          className="btn-secondary"
          style={{ width: "auto", padding: "0 16px", minHeight: "38px" }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Date Filter selector */}
      <div className="glass-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Report Period</label>
            <select
              className="form-input"
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              style={{ minHeight: "48px", background: "#0b0f19" }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {dateType === "custom" && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose Date</label>
              <input
                type="date"
                className="form-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--color-danger)", padding: "12px", textAlign: "center" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>Generating report stats...</span>
        </div>
      ) : !stats ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>No data available.</span>
        </div>
      ) : (
        <>
          {/* Seller Earnings Cards */}
          <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Seller Earnings Summary
          </h2>
          <div className="report-grid">
            <div className="seller-report-card nadia">
              <div className="seller-card-name nadia">Nadia</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Items: {stats.sellers.Nadia.itemsSold}</div>
              <div className="seller-card-value">RM {stats.sellers.Nadia.revenue.toFixed(2)}</div>
            </div>

            <div className="seller-report-card ainina">
              <div className="seller-card-name ainina">Ainina</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Items: {stats.sellers.Ainina.itemsSold}</div>
              <div className="seller-card-value">RM {stats.sellers.Ainina.revenue.toFixed(2)}</div>
            </div>

            <div className="seller-report-card afrina">
              <div className="seller-card-name afrina">Afrina</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Items: {stats.sellers.Afrina.itemsSold}</div>
              <div className="seller-card-value">RM {stats.sellers.Afrina.revenue.toFixed(2)}</div>
            </div>
          </div>

          {/* Overall Sales Summary */}
          <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Overall Sales Summary
          </h2>
          <div className="summary-stats-card">
            <div className="summary-stats-grid">
              <div>
                <div className="stat-label">Revenue</div>
                <div className="stat-value" style={{ color: "var(--color-success)" }}>
                  RM {stats.overall.revenue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="stat-label">Transactions</div>
                <div className="stat-value">{stats.overall.transactions}</div>
              </div>
              <div>
                <div className="stat-label">Items Sold</div>
                <div className="stat-value">{stats.overall.itemsSold}</div>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Seller Breakdown
          </h2>
          <div className="table-container" style={{ marginBottom: "24px" }}>
            <table>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Items Sold</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="badge badge-nadia">Nadia</span>
                  </td>
                  <td>{stats.sellers.Nadia.itemsSold} items</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>RM {stats.sellers.Nadia.revenue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-ainina">Ainina</span>
                  </td>
                  <td>{stats.sellers.Ainina.itemsSold} items</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>RM {stats.sellers.Ainina.revenue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-afrina">Afrina</span>
                  </td>
                  <td>{stats.sellers.Afrina.itemsSold} items</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>RM {stats.sellers.Afrina.revenue.toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: "2px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <td style={{ fontWeight: "700" }}>Total</td>
                  <td style={{ fontWeight: "700" }}>{stats.overall.itemsSold} items</td>
                  <td style={{ textAlign: "right", fontWeight: "800", color: "var(--color-success)" }}>
                    RM {stats.overall.revenue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Export Actions Card */}
          <h2 style={{ fontSize: "1.1rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Export Reports
          </h2>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Export Transactions */}
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "6px" }}>Detailed Transaction Log</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={() => handleExport("transactions", "csv")} className="btn-secondary" style={{ padding: "8px", fontSize: "0.9rem" }}>
                  Download CSV
                </button>
                <button onClick={() => handleExport("transactions", "excel")} className="btn-secondary" style={{ padding: "8px", fontSize: "0.9rem" }}>
                  Download Excel
                </button>
              </div>
            </div>

            <hr style={{ borderColor: "var(--border-color)", margin: "8px 0" }} />

            {/* Export Report Stats */}
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "6px" }}>Aggregated Sales Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={() => handleExport("reports", "csv")} className="btn-secondary" style={{ padding: "8px", fontSize: "0.9rem" }}>
                  Download CSV
                </button>
                <button onClick={() => handleExport("reports", "excel")} className="btn-secondary" style={{ padding: "8px", fontSize: "0.9rem" }}>
                  Download Excel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
