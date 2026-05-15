export function preserveCalmEvolution(text: string) {
  return text
    .replace(/\bdisruptive innovation\b/gi, "careful improvement")
    .replace(/\bmove aggressively\b/gi, "move carefully")
    .replace(/\bconstant reinvention\b/gi, "steady refinement");
}
