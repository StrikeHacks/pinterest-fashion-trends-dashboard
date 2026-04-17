/**
 * Trend Calculator
 *
 * Compares recent vs older data to classify keywords as rising/stable/falling.
 * Uses pct_growth_mom as the primary signal.
 *
 * Algorithm:
 *   1. Get the latest entry per keyword+country
 *   2. Get the entry from N days ago
 *   3. Calculate: growth = (new - old) / |old| * 100
 *   4. Classify: rising (>20%), stable (-20% to 20%), falling (<-20%)
 *
 * Usage:
 *   node scripts/calculate-trends.js              → calculate + display
 *   node scripts/calculate-trends.js --store       → calculate + store in DB
 */

require("dotenv").config();
const supabase = require("../backend/supabaseClient");

// --- Configuration ---

const COMPARE_DAYS = 7; // Compare today vs 7 days ago
const THRESHOLDS = {
  rising: 20,    // > +20% growth
  falling: -20,  // < -20% growth
};

// --- Core Calculation ---

/**
 * Calculate trend status for all keywords in a given country.
 * Returns an array of { keyword, country, trend_type, latest_mom, previous_mom, growth, status }
 */
async function calculateTrends(country = null) {
  // Step 1: Get latest data per keyword
  let latestQuery = supabase
    .from("trends")
    .select("keyword, country, trend_type, pct_growth_mom, fetched_date")
    .order("fetched_date", { ascending: false });

  if (country) {
    latestQuery = latestQuery.eq("country", country);
  }

  const { data: allData, error } = await latestQuery;

  if (error) {
    console.error("Error fetching trends:", error.message);
    return [];
  }

  if (!allData || allData.length === 0) {
    console.log("No trend data found.");
    return [];
  }

  // Group by keyword+country+trend_type
  const grouped = {};
  for (const row of allData) {
    const key = `${row.keyword}|${row.country}|${row.trend_type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  const results = [];

  for (const [key, entries] of Object.entries(grouped)) {
    // Sort by date descending (newest first)
    entries.sort((a, b) => b.fetched_date.localeCompare(a.fetched_date));

    const latest = entries[0];
    const previous = entries.find((e) => {
      const diffDays = daysBetween(e.fetched_date, latest.fetched_date);
      return diffDays >= COMPARE_DAYS - 1; // Allow 1 day tolerance
    });

    if (!previous) {
      // Not enough history for this keyword yet
      results.push({
        keyword: latest.keyword,
        country: latest.country,
        trend_type: latest.trend_type,
        latest_mom: Number(latest.pct_growth_mom),
        previous_mom: null,
        growth: null,
        status: "new",
        data_points: entries.length,
      });
      continue;
    }

    const latestMom = Number(latest.pct_growth_mom);
    const prevMom = Number(previous.pct_growth_mom);

    // Calculate growth between the two data points
    let growth;
    if (prevMom === 0) {
      growth = latestMom > 0 ? 100 : latestMom < 0 ? -100 : 0;
    } else {
      growth = ((latestMom - prevMom) / Math.abs(prevMom)) * 100;
    }

    growth = Math.round(growth * 10) / 10; // 1 decimal

    // Classify
    let status;
    if (growth > THRESHOLDS.rising) {
      status = "rising";
    } else if (growth < THRESHOLDS.falling) {
      status = "falling";
    } else {
      status = "stable";
    }

    results.push({
      keyword: latest.keyword,
      country: latest.country,
      trend_type: latest.trend_type,
      latest_mom: latestMom,
      previous_mom: prevMom,
      growth,
      status,
      data_points: entries.length,
    });
  }

  return results;
}

/**
 * Store calculated trend statuses back to the latest trend rows.
 */
async function storeTrendStatus(results) {
  let updated = 0;
  let errors = 0;

  for (const r of results) {
    if (r.status === "new") continue; // Skip keywords without enough history

    const { error } = await supabase
      .from("trends")
      .update({
        trend_status: r.status,
        trend_score: r.growth,
      })
      .eq("keyword", r.keyword)
      .eq("country", r.country)
      .eq("trend_type", r.trend_type)
      .eq("fetched_date", new Date().toISOString().split("T")[0]);

    if (error) {
      errors++;
    } else {
      updated++;
    }
  }

  return { updated, errors };
}

// --- Helpers ---

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

function statusIcon(status) {
  switch (status) {
    case "rising": return "🔥";
    case "falling": return "📉";
    case "stable": return "→";
    case "new": return "🆕";
    default: return "?";
  }
}

// --- Main ---

async function main() {
  console.log("=== Trend Calculator ===");
  console.log(`Comparing latest data vs ${COMPARE_DAYS} days ago`);
  console.log(`Thresholds: rising > +${THRESHOLDS.rising}%, falling < ${THRESHOLDS.falling}%\n`);

  const results = await calculateTrends();

  // Group by status for summary
  const byStatus = { rising: [], falling: [], stable: [], new: [] };
  for (const r of results) {
    byStatus[r.status].push(r);
  }

  // Display results grouped by country
  const byCountry = {};
  for (const r of results) {
    if (!byCountry[r.country]) byCountry[r.country] = [];
    byCountry[r.country].push(r);
  }

  for (const [country, trends] of Object.entries(byCountry)) {
    console.log(`\n--- ${country} ---`);
    // Sort: rising first, then stable, then falling
    trends.sort((a, b) => (b.growth || 0) - (a.growth || 0));
    for (const t of trends) {
      const growthStr = t.growth !== null ? `${t.growth > 0 ? "+" : ""}${t.growth}%` : "n/a";
      console.log(
        `  ${statusIcon(t.status)} ${t.keyword} [${t.trend_type}] — MoM: ${t.latest_mom}%, Growth: ${growthStr} (${t.data_points} days)`
      );
    }
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`  🔥 Rising:  ${byStatus.rising.length}`);
  console.log(`  →  Stable:  ${byStatus.stable.length}`);
  console.log(`  📉 Falling: ${byStatus.falling.length}`);
  console.log(`  🆕 New:     ${byStatus.new.length}`);

  // Store if --store flag
  if (process.argv.includes("--store")) {
    console.log(`\nStoring trend statuses...`);
    const { updated, errors } = await storeTrendStatus(results);
    console.log(`  ✓ Updated: ${updated}, Errors: ${errors}`);
  }

  return results;
}

module.exports = { calculateTrends, storeTrendStatus };

if (require.main === module) {
  main().catch(console.error);
}
