export function preserveOperationalCalmness(text: string) {
  return text
    .replace(/\bmove fast\b/gi, "move carefully")
    .replace(/\bship more features\b/gi, "refine what already exists")
    .replace(/\bconstant evolution\b/gi, "steady improvement");
}
