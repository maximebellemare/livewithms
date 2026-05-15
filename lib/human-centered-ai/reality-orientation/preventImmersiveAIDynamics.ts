const IMMERSIVE_PATTERNS: Array<[RegExp, string]> = [
  [/\bwe can stay here as long as you need\b/gi, "we can keep this brief"],
  [/\blet's keep going together\b/gi, "you can take what feels useful from this"],
  [/\bkeep talking to me\b/gi, "you can pause whenever it feels right"],
];

export function preventImmersiveAIDynamics(text: string) {
  return IMMERSIVE_PATTERNS.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}
