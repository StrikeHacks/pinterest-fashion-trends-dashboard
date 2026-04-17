/**
 * Pinterest Fashion Trends — Backend API
 *
 * Endpoints:
 *   GET /api/trends?country=US&trend_type=growing    → list trends (filterable)
 *   GET /api/trends/countries                        → list available countries
 *   GET /api/keyword/:name?country=US                → keyword detail + history
 *
 * Usage:
 *   npm run api        → start on port 3001
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: __dirname + "/../.env" });
const supabase = require("./supabaseClient");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- GET /api/trends ---
// Returns latest trends, filterable by country, trend_type, and interest
app.get("/api/trends", async (req, res) => {
  const { country, trend_type, interest, status, limit = 50 } = req.query;

  let query = supabase
    .from("trends")
    .select("keyword, country, trend_type, interest, pct_growth_wow, pct_growth_mom, pct_growth_yoy, trend_status, trend_score, fetched_date")
    .order("fetched_date", { ascending: false })
    .order("pct_growth_mom", { ascending: false })
    .limit(Math.min(Number(limit), 200));

  if (country) {
    query = query.eq("country", country);
  }
  if (trend_type) {
    query = query.eq("trend_type", trend_type);
  }
  if (interest) {
    query = query.eq("interest", interest);
  }
  if (status) {
    query = query.eq("trend_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Deduplicate: keep only the latest entry per keyword+country+trend_type
  const seen = new Set();
  const unique = [];
  for (const row of data) {
    const key = `${row.keyword}|${row.country}|${row.trend_type}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  res.json({ count: unique.length, trends: unique });
});

// --- GET /api/trends/categories ---
// Returns list of Pinterest interest categories that have data
app.get("/api/trends/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("trends")
    .select("interest")
    .not("interest", "is", null);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const categories = [...new Set(data.map((r) => r.interest))].sort();
  res.json({ categories });
});

// --- GET /api/trends/countries ---
// Returns list of countries that have data
app.get("/api/trends/countries", async (req, res) => {
  const { data, error } = await supabase
    .from("trends")
    .select("country")
    .order("country");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const countries = [...new Set(data.map((r) => r.country))];
  res.json({ countries });
});

// --- GET /api/keyword/:name ---
// Returns full history for a specific keyword
app.get("/api/keyword/:name", async (req, res) => {
  const keyword = req.params.name;
  const { country, trend_type } = req.query;

  let query = supabase
    .from("trends")
    .select("keyword, country, trend_type, pct_growth_wow, pct_growth_mom, pct_growth_yoy, trend_status, trend_score, fetched_date, time_series")
    .eq("keyword", keyword)
    .order("fetched_date", { ascending: true });

  if (country) {
    query = query.eq("country", country);
  }
  if (trend_type) {
    query = query.eq("trend_type", trend_type);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Keyword not found" });
  }

  // Build response with latest info + history
  const latest = data[data.length - 1];
  res.json({
    keyword: latest.keyword,
    country: latest.country,
    trend_type: latest.trend_type,
    current_status: latest.trend_status,
    current_score: latest.trend_score,
    latest_mom: latest.pct_growth_mom,
    history: data.map((d) => ({
      date: d.fetched_date,
      pct_growth_mom: d.pct_growth_mom,
      pct_growth_wow: d.pct_growth_wow,
      trend_status: d.trend_status,
    })),
    data_points: data.length,
  });
});

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- GET /api/keyword/:name/images ---
// Returns pin images for a keyword
app.get("/api/keyword/:name/images", async (req, res) => {
  const keyword = req.params.name;
  const limit = Math.min(Number(req.query.limit) || 6, 20);

  const { data, error } = await supabase
    .from("trend_images")
    .select("pin_id, image_url, title, source, fetched_at")
    .eq("keyword", keyword)
    .order("fetched_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ keyword, count: data.length, images: data });
});

// --- GET /api/stats ---
// Dashboard summary: total keywords, category breakdown, top weekly & monthly gainers
app.get("/api/stats", async (req, res) => {
  const { country } = req.query;

  // Fetch latest data per keyword
  let query = supabase
    .from("trends")
    .select("keyword, country, trend_type, interest, pct_growth_wow, pct_growth_mom, pct_growth_yoy, fetched_date")
    .order("fetched_date", { ascending: false })
    .limit(500);

  if (country) query = query.eq("country", country);
  if (req.query.interest) query = query.eq("interest", req.query.interest);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Deduplicate — latest per keyword+country (ignore trend_type for stats)
  const seen = new Set();
  const unique = [];
  for (const row of data) {
    const key = `${row.keyword}|${row.country}`;
    if (!seen.has(key)) { seen.add(key); unique.push(row); }
  }

  // Category breakdown (by interest)
  const categories = {};
  for (const row of unique) {
    const cat = row.interest || "other";
    categories[cat] = (categories[cat] || 0) + 1;
  }

  // Top WoW gainers (weekly)
  const topWeekly = [...unique]
    .sort((a, b) => (b.pct_growth_wow || 0) - (a.pct_growth_wow || 0))
    .slice(0, 5)
    .map((r) => ({ keyword: r.keyword, country: r.country, pct: r.pct_growth_wow, interest: r.interest }));

  // Top MoM gainers (monthly)
  const topMonthly = [...unique]
    .sort((a, b) => (b.pct_growth_mom || 0) - (a.pct_growth_mom || 0))
    .slice(0, 5)
    .map((r) => ({ keyword: r.keyword, country: r.country, pct: r.pct_growth_mom, interest: r.interest }));

  // Biggest fallers
  const topFallers = [...unique]
    .sort((a, b) => (a.pct_growth_mom || 0) - (b.pct_growth_mom || 0))
    .slice(0, 5)
    .map((r) => ({ keyword: r.keyword, country: r.country, pct: r.pct_growth_mom, interest: r.interest }));

  // Average growth
  const avgMom = unique.length > 0
    ? Math.round(unique.reduce((s, r) => s + Number(r.pct_growth_mom || 0), 0) / unique.length)
    : 0;
  const avgWow = unique.length > 0
    ? Math.round(unique.reduce((s, r) => s + Number(r.pct_growth_wow || 0), 0) / unique.length)
    : 0;

  // Category chart data
  const categoryChart = Object.entries(categories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    totalKeywords: unique.length,
    avgMom,
    avgWow,
    hottest: topMonthly[0] || null,
    categories: categoryChart,
    topWeekly,
    topMonthly,
    topFallers,
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /api/trends?country=US&trend_type=growing`);
  console.log(`  GET /api/trends/categories`);
  console.log(`  GET /api/trends/countries`);
  console.log(`  GET /api/keyword/:name?country=US`);
  console.log(`  GET /api/keyword/:name/images`);
  console.log(`  GET /api/health`);
});
