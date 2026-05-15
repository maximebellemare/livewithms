const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwe miss you\b/gi, "you can return whenever it feels helpful"],
  [/\bdon't lose momentum\b/gi, "you can return at your own pace"],
  [/\bstay on top of your health\b/gi, "you can check in whenever it feels useful"],
  [/\bour analysis confirms\b/gi, "some patterns may suggest"],
];

export function preventManipulativeEvolution(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
