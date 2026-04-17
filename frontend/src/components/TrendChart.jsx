import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from "recharts";
import { fetchKeywordDetail } from "../api";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value > 0 ? "+" : ""}{p.value}%</strong>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({ keyword, country, trendType }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    fetchKeywordDetail(keyword, country, trendType)
      .then((res) => {
        const history = res.history || res;
        const chart = (Array.isArray(history) ? history : [])
          .sort((a, b) => new Date(a.date || a.fetched_date) - new Date(b.date || b.fetched_date))
          .map((r) => ({
            date: r.date || r.fetched_date,
            mom: r.pct_growth_mom,
            wow: r.pct_growth_wow,
            yoy: r.pct_growth_yoy,
          }));
        setData(chart);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [keyword, country, trendType]);

  if (!keyword) {
    return (
      <div className="chart-empty-state">
        <span className="chart-empty-icon">📈</span>
        <p>Select a keyword from the table to view its trend history</p>
      </div>
    );
  }

  if (loading) return <div className="chart-empty-state"><div className="spinner" /></div>;
  if (data.length === 0) return (
    <div className="chart-empty-state">
      <span className="chart-empty-icon">📭</span>
      <p>No historical data for "{keyword}"</p>
    </div>
  );

  return (
    <div className="trend-chart">
      <div className="chart-header">
        <h3>{keyword}</h3>
        <span className="chart-badge">{data.length} data points</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradWow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#999" }}
            tickLine={false}
            axisLine={{ stroke: "#eee" }}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#999" }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke="#ddd" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="mom"
            name="MoM %"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#gradMom)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="wow"
            name="WoW %"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#gradWow)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="yoy"
            name="YoY %"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="transparent"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
