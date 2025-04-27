const request = require("supertest");
const { app, server } = require("./index");

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve)); // Ensure server is closed properly
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

// Mock successful response for checkJobs
jest.mock("./jobs/jobManager", () => ({
  checkJobs: jest.fn().mockResolvedValue(5),
}));

describe("GET /scrape-jobs 200", () => {
  it("should return 200 and message when scraping jobs is successful", async () => {
    const response = await request(app).get("/scrape-jobs");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("✅ Job scraping completed.");
  });
});

// // Mock failure response for checkJobs
// jest.mock("./jobs/jobManager", () => ({
//   checkJobs: jest.fn().mockRejectedValue(new Error("Job scraping failed")),
// }));

// describe("GET /scrape-jobs 500", () => {
//   it("should return 500 and error message when scraping jobs fails", async () => {
//     const response = await request(app).get("/scrape-jobs");

//     // Ensure it responds with a 500 status and contains an error message
//     expect(response.status).toBe(500);
//     expect(response.body.message).toBe("❌ Error during job scraping.");
//     expect(response.body.error).toBeDefined();
//   });
// });
