/**
 * Pinterest Fashion Trends Collector
 *
 * Uses Pinterest's built-in interest categories to discover trending keywords.
 * Fetches per-interest so each keyword is tagged with its Pinterest interest.
 * Falls back to realistic mock data if no API token is configured.
 */

const axios = require("axios");
require("dotenv").config();
const supabase = require("../backend/supabaseClient");

// --- Configuration ---

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// Regions to track (Pinterest's supported TrendsSupportedRegion values)
const REGIONS = ["US", "GB+IE", "DE", "FR"];

// Trend types: "growing" = newly rising, "monthly" = popular this month
const TREND_TYPES = ["growing", "monthly"];

// Pinterest interest categories — the API returns top trending keywords per interest
const INTERESTS = [
  { id: "womens_fashion", label: "Women's Fashion" },
  { id: "mens_fashion",   label: "Men's Fashion" },
  { id: "beauty",         label: "Beauty" },
  { id: "wedding",        label: "Wedding" },
  { id: "home_decor",     label: "Home Decor" },
  { id: "design",         label: "Design" },
];

// --- API Functions ---

/**
 * Fetch trending keywords from Pinterest API for a single interest + region + trend type
 */
async function fetchTrendingKeywords(region, trendType, interest) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (!token || token === "your-pinterest-token-here") {
    console.log(
      `  ⚠ No Pinterest token — using mock data for ${region}/${trendType}/${interest}`
    );
    return getMockData(region, trendType, interest);
  }

  const url = `${PINTEREST_API_BASE}/trends/keywords/${region}/top/${trendType}`;

  const params = {
    limit: 25,
    interests: [interest],
  };

  const response = await axios.get(url, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data.trends || [];
}

/**
 * Collect trends for all configured regions, trend types, and interests.
 * Each keyword is tagged with the Pinterest interest it was discovered under.
 */
async function collectAllTrends() {
  const allResults = [];
  const seen = new Set(); // deduplicate across interests

  for (const region of REGIONS) {
    for (const trendType of TREND_TYPES) {
      for (const interest of INTERESTS) {
        console.log(`\nFetching ${trendType} trends for ${region} → ${interest.label}...`);

        try {
          const trends = await fetchTrendingKeywords(region, trendType, interest.id);

          let added = 0;
          for (const trend of trends) {
            const dedupKey = `${trend.keyword}|${region}|${trendType}`;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);

            allResults.push({
              keyword: trend.keyword,
              country: region,
              trend_type: trendType,
              interest: interest.id,
              pct_growth_wow: trend.pct_growth_wow || 0,
              pct_growth_mom: trend.pct_growth_mom || 0,
              pct_growth_yoy: trend.pct_growth_yoy || 0,
              time_series: trend.time_series || null,
              fetched_at: new Date().toISOString(),
            });
            added++;
          }

          console.log(`  Found ${trends.length} trends, ${added} new`);
        } catch (error) {
          if (error.response) {
            console.error(
              `  ✗ API error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`
            );
          } else {
            console.error(`  ✗ Network error: ${error.message}`);
          }
        }
      }
    }
  }

  return allResults;
}

// --- Mock Data (for testing without API token) ---

const MOCK_BY_INTEREST = {
  womens_fashion: [
    { keyword: "coquette bow top",        pct_growth_wow: 62, pct_growth_mom: 185, pct_growth_yoy: 120 },
    { keyword: "linen midi dress",        pct_growth_wow: 45, pct_growth_mom: 130, pct_growth_yoy: 90  },
    { keyword: "wide leg jeans outfit",   pct_growth_wow: 38, pct_growth_mom: 105, pct_growth_yoy: 72  },
    { keyword: "mesh ballet flats",       pct_growth_wow: 55, pct_growth_mom: 160, pct_growth_yoy: 95  },
    { keyword: "quiet luxury blazer",     pct_growth_wow: 40, pct_growth_mom: 115, pct_growth_yoy: 80  },
    { keyword: "cherry red handbag",      pct_growth_wow: 33, pct_growth_mom: 88,  pct_growth_yoy: 55  },
    { keyword: "pleated skirt styling",   pct_growth_wow: 28, pct_growth_mom: 72,  pct_growth_yoy: 45  },
    { keyword: "oversized trench coat",   pct_growth_wow: 22, pct_growth_mom: 60,  pct_growth_yoy: 35  },
  ],
  mens_fashion: [
    { keyword: "relaxed tailoring men",   pct_growth_wow: 50, pct_growth_mom: 140, pct_growth_yoy: 88  },
    { keyword: "linen camp collar shirt", pct_growth_wow: 42, pct_growth_mom: 118, pct_growth_yoy: 70  },
    { keyword: "chunky loafers men",      pct_growth_wow: 35, pct_growth_mom: 95,  pct_growth_yoy: 60  },
    { keyword: "cargo pants outfit men",  pct_growth_wow: 30, pct_growth_mom: 82,  pct_growth_yoy: 50  },
    { keyword: "minimal gold ring men",   pct_growth_wow: 25, pct_growth_mom: 68,  pct_growth_yoy: 40  },
    { keyword: "knit polo shirt",         pct_growth_wow: 20, pct_growth_mom: 55,  pct_growth_yoy: 32  },
  ],
  beauty: [
    { keyword: "strawberry girl makeup",  pct_growth_wow: 70, pct_growth_mom: 220, pct_growth_yoy: 150 },
    { keyword: "soft glam natural look",  pct_growth_wow: 48, pct_growth_mom: 135, pct_growth_yoy: 85  },
    { keyword: "glass skin routine",      pct_growth_wow: 42, pct_growth_mom: 110, pct_growth_yoy: 75  },
    { keyword: "clean girl aesthetic",    pct_growth_wow: 35, pct_growth_mom: 90,  pct_growth_yoy: 62  },
    { keyword: "lip combo trends",        pct_growth_wow: 30, pct_growth_mom: 78,  pct_growth_yoy: 48  },
    { keyword: "milk bath nails",         pct_growth_wow: 25, pct_growth_mom: 65,  pct_growth_yoy: 38  },
  ],
  wedding: [
    { keyword: "garden wedding aesthetic",  pct_growth_wow: 55, pct_growth_mom: 170, pct_growth_yoy: 100 },
    { keyword: "bridal hair half up",       pct_growth_wow: 40, pct_growth_mom: 120, pct_growth_yoy: 78  },
    { keyword: "sage green bridesmaid",     pct_growth_wow: 35, pct_growth_mom: 100, pct_growth_yoy: 65  },
    { keyword: "wedding guest midi dress",  pct_growth_wow: 30, pct_growth_mom: 85,  pct_growth_yoy: 52  },
    { keyword: "minimalist wedding rings",  pct_growth_wow: 22, pct_growth_mom: 60,  pct_growth_yoy: 38  },
  ],
  home_decor: [
    { keyword: "japandi living room",     pct_growth_wow: 48, pct_growth_mom: 145, pct_growth_yoy: 92  },
    { keyword: "terracotta color palette", pct_growth_wow: 38, pct_growth_mom: 108, pct_growth_yoy: 70 },
    { keyword: "curved furniture trend",  pct_growth_wow: 32, pct_growth_mom: 88,  pct_growth_yoy: 55  },
    { keyword: "mushroom lamp aesthetic", pct_growth_wow: 28, pct_growth_mom: 75,  pct_growth_yoy: 45  },
    { keyword: "bouclé sofa styling",     pct_growth_wow: 20, pct_growth_mom: 58,  pct_growth_yoy: 32  },
  ],
  design: [
    { keyword: "maximalist color blocking", pct_growth_wow: 45, pct_growth_mom: 128, pct_growth_yoy: 82 },
    { keyword: "wabi sabi interior",        pct_growth_wow: 35, pct_growth_mom: 98,  pct_growth_yoy: 65 },
    { keyword: "biophilic design",          pct_growth_wow: 30, pct_growth_mom: 82,  pct_growth_yoy: 50 },
    { keyword: "art deco modern",           pct_growth_wow: 22, pct_growth_mom: 62,  pct_growth_yoy: 38 },
  ],
};

function getMockData(region, trendType, interest) {
  const base = MOCK_BY_INTEREST[interest] || MOCK_BY_INTEREST.womens_fashion;

  // Add some variation per region/trendType
  const regionMultiplier =
    region === "US" ? 1 : region === "GB+IE" ? 0.85 : region === "DE" ? 0.7 : 0.75;
  const typeMultiplier = trendType === "growing" ? 1 : 0.6;

  return base.map((item) => ({
    keyword: item.keyword,
    pct_growth_wow: Math.round(item.pct_growth_wow * regionMultiplier * typeMultiplier + (Math.random() - 0.5) * 10),
    pct_growth_mom: Math.round(item.pct_growth_mom * regionMultiplier * typeMultiplier + (Math.random() - 0.5) * 20),
    pct_growth_yoy: Math.round(item.pct_growth_yoy * regionMultiplier * typeMultiplier + (Math.random() - 0.5) * 15),
    time_series: null,
  }));
}

// --- Database Storage ---

/**
 * Store collected trends in Supabase.
 * Uses insert with conflict handling — if the same keyword+country+trend_type
 * already exists for today, it skips the duplicate.
 */
async function storeTrends(results) {
  if (results.length === 0) {
    console.log("No results to store.");
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;

  // Insert in batches of 50 to avoid payload limits
  const batchSize = 50;
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    const rows = batch.map((r) => ({
      keyword: r.keyword,
      country: r.country,
      trend_type: r.trend_type,
      interest: r.interest,
      pct_growth_wow: r.pct_growth_wow,
      pct_growth_mom: r.pct_growth_mom,
      pct_growth_yoy: r.pct_growth_yoy,
      time_series: r.time_series,
      fetched_at: r.fetched_at,
      fetched_date: r.fetched_at.split("T")[0],
    }));

    const { data, error } = await supabase.from("trends").insert(rows);

    if (error) {
      // 23505 = unique_violation — expected when re-running same day
      if (error.code === "23505") {
        console.log(`  ⚠ Batch ${Math.floor(i / batchSize) + 1}: duplicates skipped (already collected today)`);
        inserted += batch.length;
      } else {
        console.error(`  ✗ DB error (batch ${Math.floor(i / batchSize) + 1}):`, error.message);
        errors += batch.length;
      }
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

// --- Main Entry Point ---

async function main() {
  console.log("=== Pinterest Fashion Trends Collector ===");
  console.log(`Regions: ${REGIONS.join(", ")}`);
  console.log(`Trend types: ${TREND_TYPES.join(", ")}`);
  console.log(`Interests: ${INTERESTS.map((i) => i.label).join(", ")}`);

  const results = await collectAllTrends();

  console.log(`\n=== Results Summary ===`);
  console.log(`Total fashion trends collected: ${results.length}`);

  // Group by country for display
  const byCountry = {};
  for (const r of results) {
    if (!byCountry[r.country]) byCountry[r.country] = [];
    byCountry[r.country].push(r);
  }

  for (const [country, trends] of Object.entries(byCountry)) {
    console.log(`\n${country} (${trends.length} keywords):`);
    for (const t of trends.slice(0, 5)) {
      console.log(
        `  • ${t.keyword} — WoW: ${t.pct_growth_wow > 0 ? "+" : ""}${t.pct_growth_wow}%, MoM: ${t.pct_growth_mom > 0 ? "+" : ""}${t.pct_growth_mom}%`
      );
    }
    if (trends.length > 5) {
      console.log(`  ... and ${trends.length - 5} more`);
    }
  }

  // Store in database
  console.log(`\n=== Storing in Supabase ===`);
  const { inserted, errors } = await storeTrends(results);
  console.log(`  ✓ Stored: ${inserted}`);
  if (errors > 0) console.log(`  ✗ Errors: ${errors}`);
  console.log("Done.");

  return results;
}

// Export for use in other scripts
module.exports = { collectAllTrends, fetchTrendingKeywords, storeTrends, INTERESTS };

// Run directly
if (require.main === module) {
  main().catch(console.error);
}
