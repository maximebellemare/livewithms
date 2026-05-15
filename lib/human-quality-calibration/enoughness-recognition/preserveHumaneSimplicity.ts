export function preserveHumaneSimplicity(text: string) {
  return text
    .replace(/\bbeautifully optimized\b/gi, "kept simple")
    .replace(/\bperfectly tailored\b/gi, "gently adjusted")
    .replace(/\bdelightful\b/gi, "easier")
    .replace(/\s{2,}/g, " ")
    .trim();
}
