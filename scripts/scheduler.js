/**
 * Pinterest Trends Scheduler
 *
 * Runs the trend collector on a daily schedule using node-cron.
 * Includes logging to file for debugging and monitoring.
 *
 * Usage:
 *   node scripts/scheduler.js          → starts scheduler (runs daily at 06:00 UTC)
 *   node scripts/scheduler.js --now    → run once immediately + start scheduler
 */

const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { collectAllTrends, storeTrends } = require("./collect-trends");

// --- Configuration ---

const CRON_SCHEDULE = "0 6 * * *"; // Every day at 06:00 UTC
const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "collector.log");

// --- Logging ---

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);

  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + "\n");
}

// --- Collection Job ---

async function runCollection() {
  const startTime = Date.now();
  log("INFO", "=== Collection started ===");

  try {
    const results = await collectAllTrends();
    log("INFO", `Fetched ${results.length} trends`);

    const { inserted, errors } = await storeTrends(results);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log("INFO", `Stored: ${inserted}, Errors: ${errors}, Duration: ${duration}s`);
    log("INFO", "=== Collection completed ===");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log("ERROR", `Collection failed after ${duration}s: ${error.message}`);
  }
}

// --- Scheduler ---

function startScheduler() {
  log("INFO", `Scheduler started. Schedule: "${CRON_SCHEDULE}" (daily at 06:00 UTC)`);
  log("INFO", `Logs: ${LOG_FILE}`);

  cron.schedule(CRON_SCHEDULE, () => {
    runCollection();
  }, {
    timezone: "UTC",
  });
}

// --- Entry Point ---

const runNow = process.argv.includes("--now");

if (runNow) {
  log("INFO", "Immediate run requested (--now flag)");
  runCollection().then(() => {
    startScheduler();
  });
} else {
  startScheduler();
}
