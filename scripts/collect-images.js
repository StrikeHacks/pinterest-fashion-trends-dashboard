/**
 * Pinterest Image Collector — Layer 8
 *
 * Fetches pin images for trending keywords via the Pinterest API.
 * Falls back to curated placeholder images when no API token is available.
 *
 * Usage:
 *   node scripts/collect-images.js            → fetch + display
 *   node scripts/collect-images.js --store     → fetch + store in DB
 */

const axios = require("axios");
require("dotenv").config();
const supabase = require("../backend/supabaseClient");

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// --- Fetch pin images from Pinterest Search API ---

async function fetchPinImages(keyword, limit = 6) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (!token || token === "your-pinterest-token-here") {
    console.log(`  ⚠ No Pinterest token — using placeholder images for "${keyword}"`);
    return getMockImages(keyword);
  }

  try {
    const response = await axios.get(`${PINTEREST_API_BASE}/search/pins`, {
      params: {
        query: keyword,
        page_size: limit,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const pins = response.data.items || [];

    return pins.map((pin) => ({
      pin_id: pin.id,
      image_url: pin.media?.images?.["600x"]?.url || pin.media?.images?.originals?.url || "",
      title: pin.title || pin.description?.substring(0, 100) || "",
    }));
  } catch (error) {
    console.error(`  ✗ API error for "${keyword}":`, error.response?.status || error.message);
    return getMockImages(keyword);
  }
}

// --- Placeholder images (fashion-themed, royalty-free from picsum) ---

function getMockImages(keyword) {
  // Generate deterministic but varied placeholder images per keyword
  const hash = keyword.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(hash);

  return Array.from({ length: 6 }, (_, i) => ({
    pin_id: `mock-${abs}-${i}`,
    image_url: `https://picsum.photos/seed/${encodeURIComponent(keyword.replace(/\s+/g, "-"))}-${i}/400/600`,
    title: `${keyword} — inspiration ${i + 1}`,
  }));
}

// --- Collect images for all current trending keywords ---

async function collectImages() {
  console.log("Fetching trending keywords from DB...\n");

  // Get unique keywords from the latest data
  const { data, error } = await supabase
    .from("trends")
    .select("keyword")
    .order("fetched_date", { ascending: false });

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }

  const keywords = [...new Set(data.map((r) => r.keyword))];
  console.log(`Found ${keywords.length} unique keywords.\n`);

  const allImages = [];

  for (const keyword of keywords) {
    console.log(`Fetching images for "${keyword}"...`);
    const images = await fetchPinImages(keyword);

    for (const img of images) {
      if (img.image_url) {
        allImages.push({
          keyword,
          pin_id: img.pin_id,
          image_url: img.image_url,
          title: img.title,
          source: "pinterest",
          fetched_at: new Date().toISOString(),
        });
      }
    }
    console.log(`  → ${images.length} images`);
  }

  return allImages;
}

// --- Store images in Supabase ---

async function storeImages(images) {
  if (images.length === 0) {
    console.log("\nNo images to store.");
    return;
  }

  console.log(`\nStoring ${images.length} images...`);

  let inserted = 0;
  let skipped = 0;

  // Insert in batches of 50
  for (let i = 0; i < images.length; i += 50) {
    const batch = images.slice(i, i + 50);

    const { error } = await supabase.from("trend_images").upsert(batch, {
      onConflict: "keyword,image_url",
      ignoreDuplicates: true,
    });

    if (error) {
      if (error.code === "23505") {
        skipped += batch.length;
      } else {
        console.error(`  ✗ Batch error:`, error.message);
      }
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n✓ Inserted: ${inserted},  Skipped (duplicates): ${skipped}`);
}

// --- Main ---

async function main() {
  console.log("=== Pinterest Image Collector (Layer 8) ===\n");

  const images = await collectImages();

  console.log(`\nTotal: ${images.length} images collected.`);

  if (process.argv.includes("--store")) {
    await storeImages(images);
  } else {
    console.log("\nDry run — add --store to write to DB.");
    if (images.length > 0) {
      console.log("\nSample:");
      for (const img of images.slice(0, 5)) {
        console.log(`  "${img.keyword}" → ${img.image_url}`);
      }
    }
  }
}

main().catch(console.error);
