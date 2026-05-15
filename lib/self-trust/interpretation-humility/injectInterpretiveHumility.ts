const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bclearly\b/gi, ""],
  [/\bdefinitely\b/gi, "may"],
  [/\bshows\b/gi, "may reflect"],
  [/\bproves\b/gi, "may reflect"],
  [/\bconfirms\b/gi, "may suggest"],
];

export function injectInterpretiveHumility(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
