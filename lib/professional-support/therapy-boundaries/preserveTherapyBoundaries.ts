export function preserveTherapyBoundaries(text: string): string {
  return text
    .replace(/\btherapy replacement\b/gi, "therapy support")
    .replace(/\bthis replaces therapy\b/gi, "this can support therapy preparation")
    .replace(/\btherapeutic guidance\b/gi, "reflection support");
}
