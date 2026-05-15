export function removeEngagementSignals(text: string) {
  return text
    .replace(/\blikes?\b/gi, "")
    .replace(/\breactions?\b/gi, "")
    .replace(/\bcomments?\b/gi, "")
    .replace(/\bfollowers?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

