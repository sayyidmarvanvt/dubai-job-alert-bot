const axios = require("axios");
const cheerio = require("cheerio");
const { matchesKeywords } = require("../utils/helper");

async function scrapeLinkedIn() {
  try {
    const response = await axios.get(
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=react&location=Dubai&f_E=1%2C2f_TPR=r86400"
    );
    const $ = cheerio.load(response.data);

    const jobs = [];
    $("li").each((i, elem) => {
      const title = $(elem).find("h3").text().trim();
      const href = $(elem).find("a").attr("href");
      if (title && href && matchesKeywords(title)) {
        jobs.push({
          title,
          href: href.split("?")[0],
          source: "LinkedIn",
        });
      }
    });

    return jobs;
  } catch (error) {
    console.error("LinkedIn scraping error:", error);
    return [];
  }
}

module.exports = scrapeLinkedIn;
