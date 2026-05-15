export function removePopularityMechanics(text: string) {
  return text
    .replace(/\blikes?\b/gi, "responses")
    .replace(/\bfollowers?\b/gi, "people")
    .replace(/\btop contributors?\b/gi, "recent voices")
    .replace(/\bmost popular\b/gi, "quietly resonant")
    .replace(/\s{2,}/g, " ")
    .trim();
}
