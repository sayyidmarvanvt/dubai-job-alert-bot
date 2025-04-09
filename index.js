require("dotenv").config();

const client = require("./discord/client");
const { scrapeLinkedIn, scrapeBayt } = require("./jobs");
const { getUniqueJobKey } = require("./utils/helper");
const express = require("express");
const cron = require("node-cron");


const app = express();
const PORT = process.env.PORT || 3000;

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const seenJobs = new Set();

async function checkJobs() {
  try {
     console.log("Starting job check...");
     const results = await Promise.allSettled([
       scrapeLinkedIn().catch((e) => {
         console.error("LinkedIn error:", e);
         return [];
       }),
       scrapeBayt().catch((e) => {
         console.error("Bayt error:", e);
         return [];
       }),
     ]);    

    console.log(results);
    
    const allJobs = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const uniqueJobsMap = new Map();

   for (const job of allJobs) {
     const key = getUniqueJobKey(job);
     console.log(`Generated Key: ${key}`); // Log the key for debugging
     if (!uniqueJobsMap.has(key)) {
       uniqueJobsMap.set(key, job);
     }
   }

 const uniqueJobs = Array.from(uniqueJobsMap.values());

 // New jobs counter
 let newCount = 0;
 for (const job of uniqueJobs) {
   const key = getUniqueJobKey(job);
   if (!seenJobs.has(key)) {
     seenJobs.add(key);
     newCount++;
     client.channels.cache
       .get(CHANNEL_ID)
       ?.send(`💼 **${job.title}**\n🌐 ${job.source}\n🔗 ${job.href}`);
   }
 }

    console.log(`✅ Checked jobs. New unique jobs posted: ${newCount}`);
  } catch (err) {
    console.error("❌ Error during job check:", err.message);
  }
}

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
  checkJobs(); // Initial job check when the bot starts
  cron.schedule("*/30 * * * *", () => {
    console.log("🔍 Checking for new jobs...");
    checkJobs(); // Periodic job check every 30 minutes
  });
});

client.login(BOT_TOKEN);

let server;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  server = app;
});

// Self-ping after server is confirmed running
setInterval(() => {
  if (server) {
    axios
      .get(`https://dubai-job-alert-bot.onrender.com/scrape-jobs`)
      .then(() => console.log("🔁 Self-ping successful"))
      .catch((err) => console.error("⚠️ Self-ping failed:", err.message));
  }
}, 14 * 60 * 1000);
