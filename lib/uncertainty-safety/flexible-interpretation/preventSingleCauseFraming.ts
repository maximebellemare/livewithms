const CAUSAL_PATTERNS: Array<[RegExp, string]> = [
  [/\bbecause\b/gi, "and"],
  [/\bdue to\b/gi, "alongside"],
  [/\bcaused by\b/gi, "possibly connected with"],
  [/\bcaused\b/gi, "may be connected with"],
  [/\bresult of\b/gi, "part of"],
];

export function preventSingleCauseFraming(text: string) {
  return CAUSAL_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}
