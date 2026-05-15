import type { PhilosophyValidation } from "../types";

const AUTONOMY_BLOCKERS = [
  { pattern: /\byou need this\b/i, reason: "need-framing" },
  { pattern: /\bthe system knows\b/i, reason: "system-superiority" },
  { pattern: /\bjust follow\b/i, reason: "directive-instruction" },
];

export function validateAutonomyPreservation(text: string): PhilosophyValidation {
  const reasons = AUTONOMY_BLOCKERS.filter((item) => item.pattern.test(text)).map((item) => item.reason);

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
