const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bscore\b/gi, "completion"],
  [/\brank(?:ing)?\b/gi, "rhythm"],
  [/\btop result\b/gi, "steady moment"],
  [/\bcognitive age\b/gi, "cognitive rhythm"],
];

export function preventScorePsychology(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
