const axios = require("axios");
const cheerio = require("cheerio");
const { matchesKeywords } = require("../utils/helper");

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

async function scrapeBayt() {
  try {
    const url =
      "https://www.bayt.com/en/uae/jobs/react-developer-jobs/?filters%5Bjb_last_modification_date_interval%5D%5B%5D=3";
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
    return jobs;
  } catch (error) {
    console.error("Bayt scraping error:", error);
    return [];
  }
}

module.exports = scrapeBayt;
