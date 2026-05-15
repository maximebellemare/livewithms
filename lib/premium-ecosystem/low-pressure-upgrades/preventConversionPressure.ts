export function preventConversionPressure(text: string): string {
  return text
    .replace(/\bunlock now\b/gi, "available if useful")
    .replace(/\bdon't miss\b/gi, "you can come back to this")
    .replace(/\bupgrade today\b/gi, "explore premium")
    .replace(/\bact now\b/gi, "take your time");
}
