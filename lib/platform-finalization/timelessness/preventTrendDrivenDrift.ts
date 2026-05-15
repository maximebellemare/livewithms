export function preventTrendDrivenDrift(text: string) {
  return text
    .replace(/\bviral\b/gi, "steady")
    .replace(/\btrend[- ]?driven\b/gi, "human-centered")
    .replace(/\bhype cycle\b/gi, "long-term relevance")
    .replace(/\breinvent(?: [a-z]+)? constantly\b/gi, "refine carefully");
}
