/**
 * Seed historical mock data for testing trend calculations.
 * Creates 7 days of data with varying growth values to simulate real trends.
 * Keywords are tagged with Pinterest interest categories.
 *
 * Run once: node scripts/seed-history.js
 */

require("dotenv").config();
const supabase = require("../backend/supabaseClient");

const KEYWORDS = [
  // Women's Fashion
  { keyword: "coquette bow top",        interest: "womens_fashion", trajectory: "rising"  },
  { keyword: "linen midi dress",        interest: "womens_fashion", trajectory: "rising"  },
  { keyword: "wide leg jeans outfit",   interest: "womens_fashion", trajectory: "stable"  },
  { keyword: "mesh ballet flats",       interest: "womens_fashion", trajectory: "rising"  },
  { keyword: "quiet luxury blazer",     interest: "womens_fashion", trajectory: "stable"  },
  { keyword: "cherry red handbag",      interest: "womens_fashion", trajectory: "falling" },
  { keyword: "pleated skirt styling",   interest: "womens_fashion", trajectory: "rising"  },
  { keyword: "oversized trench coat",   interest: "womens_fashion", trajectory: "falling" },
  // Men's Fashion
  { keyword: "relaxed tailoring men",   interest: "mens_fashion",   trajectory: "rising"  },
  { keyword: "linen camp collar shirt", interest: "mens_fashion",   trajectory: "rising"  },
  { keyword: "chunky loafers men",      interest: "mens_fashion",   trajectory: "stable"  },
  { keyword: "cargo pants outfit men",  interest: "mens_fashion",   trajectory: "rising"  },
  { keyword: "minimal gold ring men",   interest: "mens_fashion",   trajectory: "falling" },
  { keyword: "knit polo shirt",         interest: "mens_fashion",   trajectory: "stable"  },
  // Beauty
  { keyword: "strawberry girl makeup",  interest: "beauty",         trajectory: "rising"  },
  { keyword: "soft glam natural look",  interest: "beauty",         trajectory: "rising"  },
  { keyword: "glass skin routine",      interest: "beauty",         trajectory: "stable"  },
  { keyword: "clean girl aesthetic",    interest: "beauty",         trajectory: "rising"  },
  { keyword: "lip combo trends",        interest: "beauty",         trajectory: "stable"  },
  { keyword: "milk bath nails",         interest: "beauty",         trajectory: "falling" },
  // Wedding
  { keyword: "garden wedding aesthetic",  interest: "wedding",      trajectory: "rising"  },
  { keyword: "sage green bridesmaid",     interest: "wedding",      trajectory: "rising"  },
  { keyword: "wedding guest midi dress",  interest: "wedding",      trajectory: "stable"  },
  // Home Decor
  { keyword: "japandi living room",     interest: "home_decor",     trajectory: "rising"  },
  { keyword: "terracotta color palette", interest: "home_decor",    trajectory: "stable"  },
  { keyword: "curved furniture trend",  interest: "home_decor",     trajectory: "rising"  },
  // Design
  { keyword: "maximalist color blocking", interest: "design",       trajectory: "rising"  },
  { keyword: "wabi sabi interior",        interest: "design",       trajectory: "stable"  },
];

const COUNTRIES = ["US", "GB+IE", "DE", "FR"];
const TREND_TYPES = ["growing", "monthly"];

// Generate a growth value that follows a trajectory over days
function generateGrowth(trajectory, dayIndex, totalDays) {
  const noise = (Math.random() - 0.5) * 10; // ±5% randomness
  switch (trajectory) {
    case "rising":
      return Math.round(30 + (dayIndex / totalDays) * 80 + noise);  // 30% → 110%
    case "falling":
      return Math.round(60 - (dayIndex / totalDays) * 90 + noise);  // 60% → -30%
    case "stable":
      return Math.round(10 + noise);                                 // ~10% ± noise
    default:
      return 0;
  }
}

async function seedHistory() {
  const days = 7;
  const rows = [];
  const today = new Date();

  for (let d = days; d >= 1; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    for (const { keyword, interest, trajectory } of KEYWORDS) {
      for (const country of COUNTRIES) {
        for (const trend_type of TREND_TYPES) {
          const mom = generateGrowth(trajectory, days - d, days);
          rows.push({
            keyword,
            country,
            trend_type,
            interest,
            pct_growth_wow: Math.round(mom * 0.3),
            pct_growth_mom: mom,
            pct_growth_yoy: Math.round(mom * 0.5),
            time_series: null,
            fetched_at: date.toISOString(),
            fetched_date: dateStr,
          });
        }
      }
    }
  }

  console.log(`Seeding ${rows.length} historical rows (${days} days × ${KEYWORDS.length} keywords × ${COUNTRIES.length} countries × ${TREND_TYPES.length} types)...`);

  // Insert in batches
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("trends").insert(batch);
    if (error) {
      if (error.code === "23505") {
        console.log(`  ⚠ Batch ${Math.floor(i / batchSize) + 1}: some duplicates skipped`);
      } else {
        console.error(`  ✗ Batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    inserted += batch.length;
  }

  console.log(`✓ Seeded ${inserted} rows.`);
}

seedHistory().catch(console.error);
