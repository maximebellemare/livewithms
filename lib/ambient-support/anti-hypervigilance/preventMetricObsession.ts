export function preventMetricObsession(text: string): string {
  return text
    .replace(/\bscore\b/gi, "signal")
    .replace(/\breadiness\b/gi, "context")
    .replace(/\boptimi[sz]e your body\b/gi, "support your pacing")
    .replace(/\bcheck your metrics\b/gi, "notice what feels helpful");
}
