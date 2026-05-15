export function preserveHumanVariability(text: string): string {
  return text
    .replace(/\bdefinitely\b/gi, "sometimes")
    .replace(/\bclearly\b/gi, "at times")
    .replace(/\bexactly\b/gi, "partly")
    .concat(" Variability can still matter more than any pattern.");
}
