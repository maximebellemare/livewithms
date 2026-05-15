const CERTAINTY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bclearly\b/gi, "gently"],
  [/\bdefinitely\b/gi, "possibly"],
  [/\bis\b/gi, "may be"],
  [/\bare\b/gi, "may be"],
  [/\bshowed\b/gi, "seemed to show"],
];

export function reduceInterpretationCertainty(text: string) {
  return CERTAINTY_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

