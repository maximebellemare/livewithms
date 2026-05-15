export function preventFearBasedSummaries(text: string): string {
  return text
    .replace(/\byou should be concerned\b/gi, "this may be worth discussing")
    .replace(/\bworrying\b/gi, "worth noting")
    .replace(/\balarming\b/gi, "more noticeable")
    .replace(/\bwatch closely\b/gi, "keep in mind");
}
