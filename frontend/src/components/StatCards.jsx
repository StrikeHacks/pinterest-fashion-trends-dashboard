const INTEREST_LABELS = {
  womens_fashion: "Women's Fashion",
  mens_fashion: "Men's Fashion",
  beauty: "Beauty",
  wedding: "Wedding",
  home_decor: "Home Decor",
  design: "Design",
};

export default function StatCards({ stats }) {
  if (!stats) {
    return (
      <div className="stat-cards">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card skeleton">
            <div className="stat-icon-wrap shimmer" />
            <div className="stat-body">
              <span className="stat-label shimmer" style={{ width: 80 }}>&nbsp;</span>
              <span className="stat-value shimmer" style={{ width: 60 }}>&nbsp;</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Tracked Keywords",
      value: stats.totalKeywords,
      icon: "📊",
      bg: "#eef2ff",
      color: "#6366f1",
    },
    {
      label: "Avg Monthly Growth",
      value: `${stats.avgMom > 0 ? "+" : ""}${stats.avgMom}%`,
      icon: "📈",
      bg: stats.avgMom > 0 ? "#ecfdf5" : "#fef2f2",
      color: stats.avgMom > 0 ? "#059669" : "#dc2626",
      trend: stats.avgMom > 0 ? "up" : "down",
    },
    {
      label: "Avg Weekly Growth",
      value: `${stats.avgWow > 0 ? "+" : ""}${stats.avgWow}%`,
      icon: "⚡",
      bg: stats.avgWow > 0 ? "#ecfdf5" : "#fef2f2",
      color: stats.avgWow > 0 ? "#059669" : "#dc2626",
      trend: stats.avgWow > 0 ? "up" : "down",
    },
    {
      label: "Hottest Keyword",
      value: stats.hottest?.keyword || "—",
      sub: stats.hottest ? `+${stats.hottest.pct}% MoM · ${INTEREST_LABELS[stats.hottest.interest] || stats.hottest.interest || "Other"}` : "",
      icon: "🔥",
      bg: "#eef2ff",
      color: "#4f46e5",
    },
  ];

  return (
    <div className="stat-cards">
      {cards.map((c, i) => (
        <div key={c.label} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="stat-icon-wrap" style={{ background: c.bg }}>
            <span className="stat-icon">{c.icon}</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">{c.label}</span>
            <div className="stat-value-row">
              <span className="stat-value" style={{ color: c.color }}>{c.value}</span>
              {c.trend && (
                <span className={`stat-trend ${c.trend}`}>
                  {c.trend === "up" ? "↑" : "↓"}
                </span>
              )}
            </div>
            {c.sub && <span className="stat-sub">{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
