require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
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
const searchKeywords = ["mern", "react", "node", "full stack", "web developer"];

function matchesKeywords(title, description = "") {
  const text = (title + " " + description).toLowerCase();
  // If description is empty, just check the title
  if (description.trim() === "") {
    return searchKeywords.some((kw) => title.toLowerCase().includes(kw));
  }
  // Otherwise, check both title and description
  return searchKeywords.some((kw) => text.includes(kw));
}


// ── LinkedIn ──
// list → fetch detail → extract #job-details
async function scrapeLinkedIn() {
  const url =
    "https://www.linkedin.com/jobs/search/?keywords=mern&location=Dubai&f_E=1%2C2";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const listings = [];

  $("a.job-card-list__title--link").each((_, el) => {
    const title = $(el).text().trim();
    const href = "https://www.linkedin.com" + $(el).attr("href");
    listings.push({ title, href });
  });

  const jobs = await Promise.all(
    listings.map(async ({ title, href }) => {
      try {
        const res = await axios.get(href);
        const $d = cheerio.load(res.data);
        const description = $d("#job-details").text().trim();
        if (matchesKeywords(title, description)) {
          return { title, href, source: "LinkedIn" };
        }
      } catch (e) {
        console.error("LinkedIn detail error:", href, e.message);
      }
      return null;
    })
  );

  return jobs.filter(Boolean);
}

// ── Bayt ──
// extract title, href, and listing snippet from .jb-descr
async function scrapeBayt() {
  const url =
    "https://www.bayt.com/en/uae/jobs/react-developer-jobs/?filters%5Bjb_last_modification_date_interval%5D%5B%5D=3";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const jobs = [];

  $("li[data-js-job]").each((_, el) => {
    const title = $(el).find("h2 a").text().trim();
    const href = "https://www.bayt.com" + $(el).find("h2 a").attr("href");
    const description = $(el).find("div.jb-descr.m10t.t-small").text().trim();
    if (matchesKeywords(title, description)) {
      jobs.push({ title, href, source: "Bayt" });
    }
  });

  return jobs;
}

// ── NaukriGulf ──
// extract title, href, and snippet from p.description
async function scrapeNaukriGulf() {
  const url =
    "https://www.naukrigulf.com/mern-jobs-in-uae-and-dubai?experience=0&titles=2710,9947";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const jobs = [];

  $("div.ng-box.srp-tuple").each((_, el) => {
    const title = $(el).find("p.designation-title").text().trim();
    const href = $(el).find("a.info-position").attr("href");
    const description = $(el).find("p.description").text().trim();
    if (matchesKeywords(title, description)) {
      jobs.push({ title, href, source: "NaukriGulf" });
    }
  });

  return jobs;
}

// ── Indeed ──
// each container .css-pt3vth.e37uo190 → title, link, snippet
async function scrapeIndeed() {
  const url = "https://ae.indeed.com/jobs?q=react&l=Dubai&fromage=1";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const jobs = [];

  $("div.css-pt3vth.e37uo190").each((_, el) => {
    const title = $(el).find("h2.jobTitle span[title]").text().trim();
    const href =
      "https://ae.indeed.com" + $(el).find("h2.jobTitle a").attr("href");
    const description = $(el)
      .find("div[data-testid='jobsnippet_footer']")
      .text()
      .trim();
    if (matchesKeywords(title, description)) {
      jobs.push({ title, href, source: "Indeed" });
    }
  });

  return jobs;
}


async function checkJobs() {
  try {
    const results = await Promise.allSettled([
      scrapeLinkedIn(),
      scrapeBayt(),
      scrapeNaukriGulf(),
      scrapeIndeed(),
    ]);

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
    .catch((err) =>
      console.error("⚠️ Self-ping failed:", err.message)
    );
}, 14 * 60 * 1000); // 14 minutes

