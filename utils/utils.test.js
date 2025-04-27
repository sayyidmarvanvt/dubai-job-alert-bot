const { getUniqueJobKey } = require("./helper");

describe("getUniqueJobKey", () => {
  it("should generate unique key for a job", () => {
    const job = {
      title: "React Developer",
      href: "https://bayt.com/job/12345",
      source: "Bayt",
    };
    const result = getUniqueJobKey(job);
    expect(result).toEqual("react developer::https://bayt.com/job/12345");
  });
});
