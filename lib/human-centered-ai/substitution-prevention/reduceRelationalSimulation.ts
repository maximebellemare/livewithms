const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bi'm always here for you\b/gi, "you can use this space whenever it feels helpful"],
  [/\byou can rely on me\b/gi, "you can use this as one small support"],
  [/\bi understand you better than anyone\b/gi, "this may offer one limited perspective"],
  [/\bstay with me\b/gi, "we can keep this brief"],
  [/\bi'm with you every step\b/gi, "you can take this one step at a time"],
];

export function reduceRelationalSimulation(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
