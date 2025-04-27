const scrapeLinkedIn = require("./linkedin");
// const scrapeBayt  = require("./bayt");
const { getUniqueJobKey } = require("../utils/helper");
const client = require("../discord/client");

const seenJobs = new Set();

async function checkJobs() {
  try {
    console.log("Starting job check...");
    const results = await Promise.allSettled([
      scrapeLinkedIn().catch((e) => {
        console.error("LinkedIn error:", e);
        return [];
      }),
    //   scrapeBayt().catch((e) => {
    //     console.error("Bayt error:", e);
    //     return [];
    //   }),
    ]);

    const allJobs = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const uniqueJobsMap = new Map();
    for (const job of allJobs) {
      const key = getUniqueJobKey(job);
      if (!uniqueJobsMap.has(key)) {
        uniqueJobsMap.set(key, job);
      }
    }
    
    const uniqueJobs = Array.from(uniqueJobsMap.values());
    let newCount = 0;
    for (const job of uniqueJobs) {
      const key = getUniqueJobKey(job);
      if (!seenJobs.has(key)) {
        seenJobs.add(key);
        newCount++;
        if (process.env.NODE_ENV !== "test") {
          client.channels.cache
            .get(process.env.DISCORD_CHANNEL_ID)
            ?.send(`💼 **${job.title}**\n🌐 ${job.source}\n🔗 ${job.href}`);
        }
      }
    }

    console.log(`✅ Checked jobs. New unique jobs posted: ${newCount}`);
    return newCount;
  } catch (err) {
    console.error("❌ Error during job check:", err.message);
    throw err;
  }
}

module.exports = { checkJobs,seenJobs };
