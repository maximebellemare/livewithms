const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bworsened significantly\b/gi, "felt more difficult recently"],
  [/\bprogression appears likely\b/gi, "temporary strain or fluctuation may also be part of the picture"],
  [/\byou should be concerned\b/gi, "it may be worth staying gentle with interpretation"],
  [/\bdeterioration\b/gi, "a harder stretch"],
  [/\bdecline\b/gi, "a heavier period"],
];

export function softenEscalatoryLanguage(text: string) {
  return REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

