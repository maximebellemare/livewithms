const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bimprove your brain power\b/gi, "support focus gently"],
  [/\bbrain performance\b/gi, "attention support"],
  [/\btrain harder\b/gi, "keep this gentle"],
  [/\bpush through\b/gi, "take this at an easier pace"],
];

export function removePerformanceFraming(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
