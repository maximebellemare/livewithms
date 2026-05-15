export function preventFeatureInflation(text: string) {
  return text
    .replace(/\bmore features\b/gi, "better refinement")
    .replace(/\bendless expansion\b/gi, "careful simplicity")
    .replace(/\badd more\b/gi, "simplify first");
}
