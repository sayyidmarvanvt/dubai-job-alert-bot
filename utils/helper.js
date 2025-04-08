const searchKeywords = ["react", "mern", "node", "software", "junior"];

function getUniqueJobKey(job) {
  const title = job.title.toLowerCase().trim();
  const href = job.href.split("?")[0];
  return `${title}::${href}`;
}

function matchesKeywords(title) {
  const text = title.toLowerCase();
  return searchKeywords.some((kw) => text.includes(kw));
}

module.exports = { getUniqueJobKey, matchesKeywords };
