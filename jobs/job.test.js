const scrapeLinkedIn = require("./linkedin");
const scrapeBayt = require("./bayt");
const axios = require("axios");

jest.mock("axios");

describe("Job Scraping Tests", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("scrapeLinkedIn", () => {
    it("should return correct jobs data from LinkedIn", async () => {
      const fakeHTML = `
        <ul>
          <li>
            <a href="https://linkedin.com/job/12345">Job Link</a>
            <h3>React Developer</h3>
          </li>
        </ul>
      `;
      axios.get.mockResolvedValue({ data: fakeHTML });
      const result = await scrapeLinkedIn();
      expect(result).toEqual([
        {
          title: "React Developer",
          href: "https://linkedin.com/job/12345",
          source: "LinkedIn",
        },
      ]);
    });

    it("should handle network errors gracefully", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));
      const result = await scrapeLinkedIn();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "LinkedIn scraping error:",
        expect.any(Error)
      );
    });
  });

  describe("scrapeBayt", () => {
    it("should return correct jobs data from Bayt", async () => {
      const fakeHTML = `
        <a href="/en/uae/jobs/https://bayt.com/job/12345">React Developer</a>
      `;
      axios.get.mockResolvedValue({ data: fakeHTML });
      const result = await scrapeBayt();
      expect(result).toEqual([
        {
          title: "React Developer",
          href: "https://www.bayt.com/en/uae/jobs/https://bayt.com/job/12345",
          source: "Bayt",
        },
      ]);
    });

    it("should handle network errors gracefully", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));
      const result = await scrapeBayt();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Bayt scraping error:",
        expect.any(Error)
      );
    });
  });
});
