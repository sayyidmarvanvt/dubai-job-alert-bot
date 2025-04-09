const puppeteer = require("puppeteer");
const { matchesKeywords } = require("../utils/helper");

async function scrapeLinkedIn() {
  const url =
    "https://www.linkedin.com/jobs/search/?keywords=react&location=Dubai&f_E=1%2C2";

  // Launch browser with minimal configuration
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Navigate to page
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for job listings to load
    await page.waitForSelector(".jobs-search__results-list", {
      timeout: 15000,
    });

    // Get all job cards
    const jobs = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("a.base-card__full-link").forEach((link) => {
        const titleElement = link.querySelector("span.sr-only");
        if (titleElement) {
          items.push({
            title: titleElement.innerText.trim(),
            href: link.href.split("?")[0], // Remove query parameters
          });
        }
      });
      return items;
    });

    // Filter by keywords
    return jobs
      .filter((job) => matchesKeywords(job.title))
      .map((job) => ({ ...job, source: "LinkedIn" }));
  } catch (error) {
    console.error("LinkedIn scraping error:", error);
    return []; // Return empty array on error
  } finally {
    await browser.close();
  }
}

module.exports = scrapeLinkedIn;
