const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bshould be concerned\b/gi, "may be worth noticing gently"],
  [/\bserious warning sign\b/gi, "more noticeable shift"],
  [/\bgetting much worse\b/gi, "feeling more difficult"],
  [/\bhigh risk\b/gi, "a more vulnerable stretch"],
];

export function reduceFearFraming(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
