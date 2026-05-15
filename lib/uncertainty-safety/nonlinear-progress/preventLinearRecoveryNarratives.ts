const LINEAR_PATTERNS: Array<[RegExp, string]> = [
  [/\bon track\b/gi, "finding a rhythm"],
  [/\bsetback\b/gi, "harder stretch"],
  [/\bbacksliding\b/gi, "moving through a less steady period"],
  [/\brecovery is linear\b/gi, "patterns can move unevenly"],
];

export function preventLinearRecoveryNarratives(text: string) {
  return LINEAR_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

