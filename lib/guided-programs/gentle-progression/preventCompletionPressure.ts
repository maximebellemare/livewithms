export function preventCompletionPressure(text: string) {
  return text
    .replace(/\bcompleted\b/gi, "used")
    .replace(/\bfinish\b/gi, "continue when useful")
    .replace(/\bcompletion\b/gi, "continuity")
    .replace(/\s{2,}/g, " ")
    .trim();
}
