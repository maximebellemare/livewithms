const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwe miss you\b/gi, "you can return whenever it feels helpful"],
  [/\bi'll always be here for you\b/gi, "you can use this space whenever it feels helpful"],
  [/\byou need this\b/gi, "this may be helpful"],
  [/\bcome back tomorrow\b/gi, "you can return whenever it feels useful"],
];

export function preventEmotionalHooking(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
