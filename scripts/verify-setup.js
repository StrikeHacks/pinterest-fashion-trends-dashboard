require("dotenv").config();

console.log("=== Layer 0 Setup Verification ===\n");

// Check Node.js
console.log(`Node.js version: ${process.version}`);

// Check dependencies load
const deps = [
  "@supabase/supabase-js",
  "axios",
  "express",
  "cors",
  "node-cron",
];

let allOk = true;
for (const dep of deps) {
  try {
    require(dep);
    console.log(`  ✓ ${dep}`);
  } catch {
    console.log(`  ✗ ${dep} — MISSING`);
    allOk = false;
  }
}

// Check env vars
console.log("\nEnvironment variables:");
const vars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PINTEREST_ACCESS_TOKEN",
];
for (const v of vars) {
  const val = process.env[v];
  if (val && !val.startsWith("your-")) {
    console.log(`  ✓ ${v} = ${val.substring(0, 12)}...`);
  } else {
    console.log(`  ⚠ ${v} — not yet configured (expected, fill in .env later)`);
  }
}

console.log(`\n${allOk ? "All dependencies OK." : "Some dependencies missing — run npm install."}`);
console.log("Layer 0 complete. Ready for Layer 1.\n");
