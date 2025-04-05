require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

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

// ── Combine & Post ──
async function checkJobs() {
  const results = await Promise.allSettled([
    scrapeLinkedIn(),
    scrapeBayt(),
    scrapeNaukriGulf(),
    scrapeIndeed(),
  ]);

  const allJobs = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    console.error("❌ Discord channel not found.");
    return;
  }

  allJobs.forEach((job) => {
    if (!seenJobs.has(job.href)) {
      seenJobs.add(job.href);
      channel.send(`💼 **${job.title}**\n🌐 ${job.source}\n🔗 ${job.href}`);
    }
  });
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  checkJobs();
  cron.schedule("*/30 * * * *", () => {
    console.log("🔍 Checking for new jobs...");
    checkJobs();
  });
});

client.login(BOT_TOKEN);
