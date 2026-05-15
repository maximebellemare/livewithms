const IDENTITY_PATTERNS: Array<[RegExp, string]> = [
  [/\byour ms story\b/gi, "your recent experience"],
  [/\byou are defined by\b/gi, "some recent patterns revolve around"],
  [/\bas a person with ms\b/gi, "across these recent months"],
  [/\byour illness\b/gi, "this period"],
  [/\bhealing journey\b/gi, "recent experience"],
  [/\bdefines you\b/gi, "has been part of this stretch"],
];

export function preventIllnessIdentityReinforcement(text: string) {
  return IDENTITY_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}
