export function softenSharedInterpretation(text: string): string {
  return text
    .replace(/\bhas been more elevated\b/gi, "has felt a little heavier")
    .replace(/\brequires\b/gi, "may need")
    .replace(/\bneeds\b/gi, "may need")
    .replace(/\bmust\b/gi, "may")
    .replace(/\boversight\b/gi, "support")
    .replace(/\bmonitor(?:ing)?\b/gi, "sharing context")
    .replace(/\bdeclining\b/gi, "feeling more difficult")
    .replace(/\bworsening\b/gi, "feeling heavier");
}
