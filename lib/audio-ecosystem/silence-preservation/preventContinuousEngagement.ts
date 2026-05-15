export function preventContinuousEngagement(text: string): string {
  return text
    .replace(/\bkeep listening\b/gi, "listen briefly if helpful")
    .replace(/\bstay with this audio\b/gi, "use this briefly")
    .replace(/\bcontinue the conversation\b/gi, "come back later if useful")
    .replace(/\bnever stop\b/gi, "pause whenever you want");
}
