export function preventContinuityOverload(text: string): string {
  return text
    .replace(/\bopen this on every device\b/gi, "come back on another surface if useful")
    .replace(/\bkeep checking across devices\b/gi, "pick the surface that feels easiest")
    .replace(/\bcontinue everywhere\b/gi, "continue later if helpful");
}
