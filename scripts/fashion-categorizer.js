/**
 * Fashion Categorizer — Layer 7
 *
 * Classifies trending keywords into fashion subcategories.
 * Runs after collect-trends.js to enrich data with fashion_category.
 *
 * Categories:
 *   Clothing   — dresses, jackets, jeans, tops, etc.
 *   Shoes      — sneakers, boots, heels, sandals, loafers
 *   Accessories — bags, jewelry, sunglasses, hats, watches
 *   Style      — aesthetic/style terms (minimalist, boho, streetwear)
 *   Seasonal   — season-specific trends (summer outfit, winter coat)
 *
 * Usage:
 *   node scripts/fashion-categorizer.js            → classify + display
 *   node scripts/fashion-categorizer.js --store     → classify + update DB
 */

require("dotenv").config();
const supabase = require("../backend/supabaseClient");

// --- Category Rules ---
// Order matters: first match wins. More specific patterns go first.

const CATEGORY_RULES = [
  {
    category: "Seasonal",
    patterns: [
      "summer", "winter", "spring", "fall", "autumn",
      "holiday", "christmas", "valentine", "new year",
      "festival", "back to school", "wedding guest",
    ],
  },
  {
    category: "Shoes",
    patterns: [
      "sneaker", "boot", "heel", "sandal", "loafer",
      "mule", "clog", "slipper", "flat", "pump",
      "shoe", "trainer", "espadrille", "platform",
    ],
  },
  {
    category: "Accessories",
    patterns: [
      "bag", "tote", "clutch", "purse", "handbag", "backpack",
      "earring", "necklace", "bracelet", "ring", "jewelry", "jewellery",
      "watch", "sunglasses", "glasses", "hat", "cap", "beanie",
      "scarf", "belt", "wallet",
    ],
  },
  {
    category: "Clothing",
    patterns: [
      "dress", "skirt", "blouse", "shirt", "top", "tank",
      "jacket", "blazer", "coat", "cardigan", "hoodie", "sweater",
      "jeans", "pants", "trousers", "shorts", "legging",
      "suit", "jumpsuit", "romper", "overalls",
      "denim", "linen", "silk", "leather", "wool", "cotton",
      "bikini", "swimsuit", "underwear", "lingerie",
      "outfit", "wardrobe", "capsule",
    ],
  },
  {
    category: "Style",
    patterns: [
      "minimalist", "boho", "bohemian", "preppy", "streetwear",
      "athleisure", "casual", "formal", "vintage", "retro",
      "aesthetic", "chic", "elegant", "trendy", "classic",
      "grunge", "punk", "cottagecore", "dark academia",
      "old money", "quiet luxury", "clean girl", "coastal",
      "runway", "couture", "fashion",
    ],
  },
];

/**
 * Classify a keyword into a fashion category.
 * Returns the category name, or "Other" if no pattern matches.
 */
function classifyKeyword(keyword) {
  const lower = keyword.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern)) {
        return rule.category;
      }
    }
  }

  return "Other";
}

/**
 * Fetch uncategorized trends from the DB and classify them.
 */
async function categorizeAll() {
  console.log("Fetching trends to categorize...\n");

  const { data, error } = await supabase
    .from("trends")
    .select("id, keyword, fashion_category")
    .order("fetched_date", { ascending: false });

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No trends found.");
    return [];
  }

  // Classify each keyword
  const results = [];
  const stats = {};

  for (const row of data) {
    const category = classifyKeyword(row.keyword);

    if (!stats[category]) stats[category] = 0;
    stats[category]++;

    // Only include rows that need updating
    if (row.fashion_category !== category) {
      results.push({ id: row.id, keyword: row.keyword, category });
    }
  }

  // Print stats
  console.log("Category distribution:");
  for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    const bar = "█".repeat(Math.ceil(count / 2));
    console.log(`  ${cat.padEnd(14)} ${String(count).padStart(4)}  ${bar}`);
  }
  console.log(`\n  Total: ${data.length} rows,  ${results.length} need updating`);

  return results;
}

/**
 * Write categories back to the DB.
 */
async function storeCategories(results) {
  if (results.length === 0) {
    console.log("\nNothing to update.");
    return;
  }

  console.log(`\nUpdating ${results.length} rows...`);

  let updated = 0;
  let errors = 0;

  // Update in batches of 100
  for (let i = 0; i < results.length; i += 100) {
    const batch = results.slice(i, i + 100);

    for (const row of batch) {
      const { error } = await supabase
        .from("trends")
        .update({ fashion_category: row.category })
        .eq("id", row.id);

      if (error) {
        console.error(`  ✗ Error updating id=${row.id}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    }
  }

  console.log(`\n✓ Updated: ${updated},  Errors: ${errors}`);
}

// --- Main ---

async function main() {
  console.log("=== Fashion Categorizer (Layer 7) ===\n");

  const results = await categorizeAll();

  if (process.argv.includes("--store")) {
    await storeCategories(results);
  } else {
    console.log("\nDry run — add --store flag to write to DB.");
    if (results.length > 0) {
      console.log("\nSample classifications:");
      for (const r of results.slice(0, 10)) {
        console.log(`  "${r.keyword}" → ${r.category}`);
      }
    }
  }
}

main().catch(console.error);
