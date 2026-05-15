const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsigns your ms is worsening\b/gi, "changes that may be worth noticing gently"],
  [/\bsymptoms you should worry about\b/gi, "symptoms that can be discussed with care"],
  [/\bprogression fear\b/gi, "uncertainty about what symptoms mean"],
  [/\bthings are getting worse\b/gi, "things may feel heavier right now"],
];

export function softenMedicalFearLanguage(text: string) {
  return REPLACEMENTS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
