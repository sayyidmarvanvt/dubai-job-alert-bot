const searchKeywords = ["react", "mern", "node", "software", "web","developer"];

function getUniqueJobKey(job) {
  const title = job.title.toLowerCase().trim();
  const href = job.href.split("?")[0]; // Strip query params from the URL
  return `${title}::${href}`;
}

function matchesKeywords(title) {
  const text = title.toLowerCase();
  return searchKeywords.some((kw) => text.includes(kw));
}

module.exports = { getUniqueJobKey, matchesKeywords };

