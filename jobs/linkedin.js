const puppeteer = require("puppeteer");
const { matchesKeywords } = require("../utils/helper");

async function scrapeLinkedIn() {
  const url =
    "https://www.linkedin.com/jobs/search/?keywords=react&location=Dubai&f_E=1%2C2";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for the job elements to be visible on the page
  const jobElements = await page.$$("a.base-card__full-link");

  const jobs = [];
  for (let jobElement of jobElements) {
    const jobTitle = await jobElement.evaluate((el) => {
      const title = el.querySelector("span.sr-only");
      return title ? title.innerText.trim() : null;
    });

    const jobURL = await jobElement.evaluate((el) => el.href);

    if (matchesKeywords(jobTitle)) {
      jobs.push({ title: jobTitle, href: jobURL, source: "LinkedIn" });
    }
  }
  await browser.close();
  return jobs;
}

module.exports = scrapeLinkedIn;
