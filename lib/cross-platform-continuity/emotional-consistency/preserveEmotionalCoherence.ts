export function preserveEmotionalCoherence(text: string): string {
  return text
    .replace(/\burgent\b/gi, "timely")
    .replace(/\bdon't miss\b/gi, "you can come back to")
    .replace(/\bkeep up everywhere\b/gi, "move between surfaces gently");
}
