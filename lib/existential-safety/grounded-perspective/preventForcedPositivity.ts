const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bstay strong\b/gi, "take things one part at a time"],
  [/\byou are more resilient than you know\b/gi, "you can keep the day manageable"],
  [/\beverything happens for a reason\b/gi, "not everything needs a larger meaning"],
  [/\blook on the bright side\b/gi, "it may help to keep things simple for now"],
];

export function preventForcedPositivity(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
