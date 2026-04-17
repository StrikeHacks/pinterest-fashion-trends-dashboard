import { useState, useMemo } from "react";

const INTEREST_LABELS = {
  womens_fashion: "👗 Women's",
  mens_fashion: "👔 Men's",
  beauty: "💄 Beauty",
  wedding: "💍 Wedding",
  home_decor: "🏠 Home",
  design: "🎨 Design",
};

function StatusBadge({ mom }) {
  if (mom > 50)
    return <span className="badge rising">🔥 Hot</span>;
  if (mom > 20)
    return <span className="badge rising-mild">↗ Growing</span>;
  if (mom > -20)
    return <span className="badge stable">→ Stable</span>;
  return <span className="badge falling">↘ Falling</span>;
}

function GrowthCell({ value, max }) {
  const cls = value > 20 ? "growth-up" : value < -20 ? "growth-down" : "growth-flat";
  const barWidth = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  return (
    <td className={`num ${cls}`}>
      <div className="growth-cell">
        <div className="growth-bar-track">
          <div
            className={`growth-bar-fill ${cls}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="growth-num">{value > 0 ? "+" : ""}{value}%</span>
      </div>
    </td>
  );
}

export default function TrendTable({ trends, onSelect, selectedKeyword }) {
  const [sortBy, setSortBy] = useState("pct_growth_mom");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");

  if (!trends || trends.length === 0) {
    return (
      <div className="table-empty">
        <span className="table-empty-icon">🔍</span>
        <p>No trends found for this selection</p>
      </div>
    );
  }

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const filtered = search
    ? trends.filter((t) => t.keyword.toLowerCase().includes(search.toLowerCase()))
    : trends;

  const sorted = [...filtered].sort((a, b) => {
    const av = Number(a[sortBy]) || 0;
    const bv = Number(b[sortBy]) || 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const maxMom = Math.max(...sorted.map((t) => Math.abs(Number(t.pct_growth_mom) || 0)), 1);
  const maxWow = Math.max(...sorted.map((t) => Math.abs(Number(t.pct_growth_wow) || 0)), 1);
  const maxYoy = Math.max(...sorted.map((t) => Math.abs(Number(t.pct_growth_yoy) || 0)), 1);

  const sortArrow = (col) => {
    if (sortBy !== col) return <span className="sort-arrow muted">↕</span>;
    return <span className="sort-arrow active">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <>
      <div className="table-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>
      <div className="trend-table-wrapper">
        <table className="trend-table">
          <thead>
            <tr>
              <th className="th-rank">#</th>
              <th>Keyword</th>
              <th>Interest</th>
              <th className="th-sortable" onClick={() => toggleSort("pct_growth_mom")}>
                MoM {sortArrow("pct_growth_mom")}
              </th>
              <th className="th-sortable" onClick={() => toggleSort("pct_growth_wow")}>
                WoW {sortArrow("pct_growth_wow")}
              </th>
              <th className="th-sortable" onClick={() => toggleSort("pct_growth_yoy")}>
                YoY {sortArrow("pct_growth_yoy")}
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr
                key={`${t.keyword}-${t.trend_type}-${i}`}
                className={t.keyword === selectedKeyword ? "selected" : ""}
                onClick={() => onSelect(t.keyword, t.trend_type)}
              >
                <td className="rank">{i + 1}</td>
                <td className="keyword">{t.keyword}</td>
                <td className="category">
                  <span className="cat-badge">
                    {INTEREST_LABELS[t.interest] || "📌 Other"}
                  </span>
                </td>
                <GrowthCell value={t.pct_growth_mom} max={maxMom} />
                <GrowthCell value={t.pct_growth_wow} max={maxWow} />
                <GrowthCell value={t.pct_growth_yoy} max={maxYoy} />
                <td>
                  <StatusBadge mom={t.pct_growth_mom} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {search && filtered.length === 0 && (
        <div className="table-empty sm">
          <p>No keywords matching "{search}"</p>
        </div>
      )}
    </>
  );
}
