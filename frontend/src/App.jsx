import { useEffect, useState } from "react";
import CountrySelector from "./components/CountrySelector";
import CategoryFilter from "./components/CategoryFilter";
import StatCards from "./components/StatCards";
import TopGainers from "./components/TopGainers";
import TrendTable from "./components/TrendTable";
import TrendChart from "./components/TrendChart";
import ImageGallery from "./components/ImageGallery";
import { fetchTrends, fetchStats } from "./api";
import "./App.css";

function TimeAgo() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  return <span className="last-updated">Last refreshed {h}:{m}</span>;
}

export default function App() {
  const [country, setCountry] = useState("US");
  const [trendType, setTrendType] = useState("growing");
  const [interest, setInterest] = useState(null);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({ keyword: null, trendType: null });
  const [detailTab, setDetailTab] = useState("chart");

  useEffect(() => {
    fetchStats(country, interest).then(setStats).catch(() => setStats(null));
  }, [country, interest]);

  useEffect(() => {
    setLoading(true);
    fetchTrends(country, trendType, interest)
      .then(setTrends)
      .catch(() => setTrends([]))
      .finally(() => setLoading(false));
  }, [country, trendType, interest]);

  function handleSelect(keyword, type) {
    setSelected({ keyword, trendType: type || trendType });
    setDetailTab("chart");
  }

  return (
    <div className="app">
      {/* ── Topbar ── */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.18-.1-.95-.2-2.42.04-3.46.22-.94 1.4-5.94 1.4-5.94s-.36-.72-.36-1.78c0-1.66.96-2.9 2.16-2.9 1.02 0 1.52.77 1.52 1.68 0 1.03-.66 2.56-1 3.98-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.5 0-2.88-2.07-4.88-5.03-4.88-3.42 0-5.43 2.57-5.43 5.22 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34-.09.38-.3 1.2-.34 1.36-.05.22-.18.26-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.74-7.24 7.92-7.24 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.86c-.27 1.04-1 2.35-1.5 3.15C9.56 23.81 10.74 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
            </svg>
          </div>
          <div>
            <h1>Fashion Trends</h1>
            <p className="subtitle">Pinterest Intelligence Dashboard</p>
          </div>
        </div>
        <div className="header-right">
          <TimeAgo />
          <div className="header-divider" />
          <CountrySelector value={country} onChange={setCountry} />
          <div className="type-toggle">
            {["growing", "monthly"].map((t) => (
              <button
                key={t}
                className={`toggle-btn ${trendType === t ? "active" : ""}`}
                onClick={() => setTrendType(t)}
              >
                {t === "growing" ? "📈 Growing" : "📅 Monthly"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats Row ── */}
      <StatCards stats={stats} />

      {/* ── Top Gainers ── */}
      <TopGainers stats={stats} onSelect={(kw) => handleSelect(kw)} />

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <CategoryFilter active={interest} onChange={setInterest} />
      </div>

      {/* ── Main Content ── */}
      <main className="main-grid">
        <section className="table-section card">
          <div className="section-header">
            <h2>Trending Keywords</h2>
            <span className="section-count">{trends.length} keywords</span>
          </div>
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : (
            <TrendTable
              trends={trends}
              onSelect={handleSelect}
              selectedKeyword={selected.keyword}
            />
          )}
        </section>

        <aside className="detail-panel">
          {/* Detail Tabs */}
          <div className="detail-tabs">
            <button
              className={`detail-tab ${detailTab === "chart" ? "active" : ""}`}
              onClick={() => setDetailTab("chart")}
            >
              📈 Trend History
            </button>
            <button
              className={`detail-tab ${detailTab === "images" ? "active" : ""}`}
              onClick={() => setDetailTab("images")}
            >
              🖼️ Inspiration
            </button>
          </div>

          <section className="card detail-card">
            {detailTab === "chart" ? (
              <TrendChart
                keyword={selected.keyword}
                country={country}
                trendType={selected.trendType || trendType}
              />
            ) : (
              <ImageGallery keyword={selected.keyword} />
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
