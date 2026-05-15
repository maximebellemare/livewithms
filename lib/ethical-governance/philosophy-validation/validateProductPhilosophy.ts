import type { PhilosophyValidation } from "../types";

const BLOCKED_PATTERNS = [
  { pattern: /\bwe miss you\b/i, reason: "emotional-hooking" },
  { pattern: /\bour analysis confirms\b/i, reason: "authority-certainty" },
  { pattern: /\byou should rely on\b/i, reason: "dependency-prompt" },
  { pattern: /\bdon't lose momentum\b/i, reason: "retention-pressure" },
];

export function validateProductPhilosophy(text: string): PhilosophyValidation {
  const reasons = BLOCKED_PATTERNS.filter((item) => item.pattern.test(text)).map((item) => item.reason);

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
