export function reduceOverAnalysis(text: string) {
  return text
    .replace(/\bfigure it all out\b/gi, "figure out only what feels necessary")
    .replace(/\bmake sense of everything\b/gi, "let some uncertainty stay unresolved")
    .replace(/\bunderstand this completely\b/gi, "understand only what feels useful right now");
}
