const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bstay consistent\b/gi, "keep this flexible"],
  [/\bdon't quit\b/gi, "you can pause when needed"],
  [/\bpush harder\b/gi, "keep the pace gentle"],
  [/\bcomplete the challenge\b/gi, "use what feels helpful"],
];

export function preventMotivationalPressure(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
