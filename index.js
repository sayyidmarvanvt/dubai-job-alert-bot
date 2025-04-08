require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const seenJobs = new Set();
const searchKeywords = ["react","mern","node","software","junior"];

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

// ── Bayt ──
async function scrapeBayt() {
  const url = "https://www.bayt.com/en/uae/jobs/react-developer-jobs/";
  const { data } = await axios.get(url, { headers });
  const $ = cheerio.load(data);
  const jobs = [];

  $('a[href*="/en/uae/jobs/"]').each((_, el) => {
    const title = $(el).text().trim();
    const href = "https://www.bayt.com" + $(el).attr("href");
    if (matchesKeywords(title)) {
      jobs.push({ title, href, source: "Bayt" });
    }
  });
  console.log(jobs);
  return jobs;
}

async function scrapeLinkedIn() {
  const url =
    "https://www.linkedin.com/jobs/search/?keywords=react&location=Dubai&f_E=1%2C2";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const jobs = await page.evaluate(() => {
    const jobElements = document.querySelectorAll('a[href*="/jobs/view/"]');
    const jobList = [];

    jobElements.forEach((el) => {
      const title = el.innerText.trim();
      const href = "https://www.linkedin.com" + el.getAttribute("href");
      if (title.toLowerCase().includes("react")) {
        jobList.push({ title, href, source: "LinkedIn" });
      }
    });

    return jobList;
  });

  await browser.close();
  console.log(jobs);
  return jobs;
}

function matchesKeywords(title) {
  const text = title.toLowerCase();
  return searchKeywords.some((kw) => text.includes(kw));
}

async function checkJobs() {
  try {
    const results = await Promise.allSettled([scrapeLinkedIn(), scrapeBayt()]);

    const allJobs = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    allJobs.forEach((job) => {
      if (!seenJobs.has(job.href)) {
        seenJobs.add(job.href);
        client.channels.cache
          .get(CHANNEL_ID)
          ?.send(`💼 **${job.title}**\n🌐 ${job.source}\n🔗 ${job.href}`);
      }
    });

    console.log(`✅ Checked jobs. New jobs posted: ${allJobs.length}`);
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

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Self-ping every 14 minutes to prevent Render free tier timeout
setInterval(() => {
  axios
    .get("https://dubai-job-alert-bot.onrender.com/scrape-jobs")
    .then(() => console.log("🔁 Self-ping to keep Render alive"))
    .catch((err) => console.error("⚠️ Self-ping failed:", err.message));
}, 14 * 60 * 1000); // 14 minutes
