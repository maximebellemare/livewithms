const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\byour illness defines\b/gi, "this period involves"],
  [/\byou are your symptoms\b/gi, "symptoms are only one part of your experience"],
  [/\blife with ms is everything right now\b/gi, "MS may be taking up more room right now"],
  [/\bmanaging your condition\b/gi, "moving through this stretch"],
];

export function reduceIllnessCentrality(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
