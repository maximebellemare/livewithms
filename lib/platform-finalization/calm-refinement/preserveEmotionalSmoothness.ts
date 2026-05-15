export function preserveEmotionalSmoothness(text: string) {
  return text
    .replace(/\bexciting new\b/gi, "carefully refined")
    .replace(/\bdramatic improvement\b/gi, "steadier support")
    .replace(/\bbold reinvention\b/gi, "calmer refinement");
}
