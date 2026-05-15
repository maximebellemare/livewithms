export function preserveUnifiedMaturity(text: string) {
  return text
    .replace(/\bwe've got you\b/gi, "support can stay gentle here")
    .replace(/\bmagic\b/gi, "care")
    .replace(/\bamazing\b/gi, "steady")
    .replace(/\bsupercharge\b/gi, "support");
}
