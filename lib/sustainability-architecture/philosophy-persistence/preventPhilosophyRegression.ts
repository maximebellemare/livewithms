const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwe miss you\b/gi, "you can return whenever it feels helpful"],
  [/\bour analysis confirms\b/gi, "some patterns may suggest"],
  [/\bdon't lose momentum\b/gi, "you can keep things gentle"],
];

export function preventPhilosophyRegression(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text).trim();
}
