require("dotenv").config();
const express = require("express");
const { checkJobs } = require("./jobs/jobManager");
const cron = require("node-cron");
const client = require("./discord/client");

const PORT = process.env.PORT;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const app = express();
const seenJobs = new Set();
module.exports.seenJobs = seenJobs;

app.get("/scrape-jobs", async (req, res) => {
  try {
    await checkJobs();
    res.status(200).json({
      message: "✅ Job scraping completed.",
      jobsCount: seenJobs.size,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Error during job scraping.",
      error: error.message,
    });
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  checkJobs(); // Initial job check
});

client.login(BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Only start cron jobs if not in test environment
if (process.env.NODE_ENV !== "test") {
  cron.schedule("*/30 * * * *", () => {
    console.log("🔍 Checking for new jobs...");
    checkJobs();
  });
}
let server;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
