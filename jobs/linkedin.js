const puppeteer = require("puppeteer");
const { matchesKeywords } = require("../utils/helper");

async function scrapeLinkedIn() {
  const url = "https://www.linkedin.com/jobs/search/?keywords=react&location=Dubai&f_E=1%2C2";
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set user agent to mimic a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    // Wait for the main job listings container
    await page.waitForSelector('.jobs-search__results-list', { timeout: 30000 });
    
    // Scroll to load more jobs
    await autoScroll(page);
    
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

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

module.exports = scrapeLinkedIn;
