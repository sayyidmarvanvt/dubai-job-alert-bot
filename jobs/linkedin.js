const puppeteer = require("puppeteer");
const { matchesKeywords } = require("../utils/helper");

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
      if (matchesKeywords(title)) {
        jobList.push({ title, href, source: "LinkedIn" });
      }
    });

    return jobList;
  });

  await browser.close();
  return jobs;
}

module.exports = scrapeLinkedIn;
