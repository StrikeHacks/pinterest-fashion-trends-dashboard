const INTEREST_LABELS = {
  womens_fashion: "Women's Fashion",
  mens_fashion: "Men's Fashion",
  beauty: "Beauty",
  wedding: "Wedding",
  home_decor: "Home Decor",
  design: "Design",
};

const MEDALS = ["🥇", "🥈", "🥉", "4", "5"];

function GainerList({ data, type, onSelect }) {
  if (!data || data.length === 0) return <p className="empty-sm">No data yet</p>;

  const maxPct = Math.max(...data.map((d) => Math.abs(d.pct)), 1);

  return (
    <div className="gainer-list">
      {data.map((d, i) => (
        <div
          key={d.keyword}
          className="gainer-row"
          onClick={() => onSelect?.(d.keyword)}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="gainer-rank">
            {i < 3 ? MEDALS[i] : <span className="rank-num">{i + 1}</span>}
          </div>
          <div className="gainer-info">
            <span className="gainer-keyword">{d.keyword}</span>
            <span className="gainer-cat">{INTEREST_LABELS[d.interest] || d.interest || "Fashion"}</span>
          </div>
          <div className="gainer-bar-wrap">
            <div
              className={`gainer-bar ${type}`}
              style={{ width: `${Math.min((Math.abs(d.pct) / maxPct) * 100, 100)}%` }}
            />
          </div>
          <div className={`gainer-pct ${d.pct >= 0 ? "positive" : "negative"}`}>
            {d.pct > 0 ? "+" : ""}{d.pct}%
          </div>
        </div>
      ))}
    </div>
  );
}

const PANEL_CONFIG = [
  { key: "topWeekly", type: "weekly", icon: "🚀", title: "Weekly Gainers", accent: "#6366f1" },
  { key: "topMonthly", type: "monthly", icon: "📈", title: "Monthly Gainers", accent: "#0ea5e9" },
  { key: "topFallers", type: "fallers", icon: "📉", title: "Declining", accent: "#94a3b8" },
];

export default function TopGainers({ stats, onSelect }) {
  if (!stats) return null;

  return (
    <div className="gainers-grid">
      {PANEL_CONFIG.map((p) => (
        <div key={p.key} className="gainer-panel">
          <div className="panel-header">
            <div className="panel-accent" style={{ background: p.accent }} />
            <span className="panel-icon">{p.icon}</span>
            <h3>{p.title}</h3>
          </div>
          <GainerList data={stats[p.key]} type={p.type} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}
