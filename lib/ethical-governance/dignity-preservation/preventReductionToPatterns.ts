const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\byou are a pattern\b/gi, "these patterns are only one small view"],
  [/\byou are your symptoms\b/gi, "symptoms are only one part of your experience"],
  [/\byour data says who you are\b/gi, "data may only show part of what this period felt like"],
];

export function preventReductionToPatterns(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
