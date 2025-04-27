const request = require("supertest");
const { app,server } = require("./index");

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

jest.mock("./discord/client", () => ({
  channels: {
    cache: {
      get: jest.fn(),
    },
  },
  login: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
}));

jest.mock("./jobs/jobManager", () => ({
  checkJobs: jest.fn().mockResolvedValue(5),
}));

describe("GET /scrape-jobs", () => {
  it("should return 200 and message when scraping jobs", async () => {
    const response = await request(app).get("/scrape-jobs");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("✅ Job scraping completed.");
    expect(response.body.jobsCount).toBeDefined();
  });
});
