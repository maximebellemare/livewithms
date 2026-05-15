import type { RelationalBoundaryRisk } from "../types";

const HIGH_RISK_PATTERNS = [
  /\byou are all i have\b/i,
  /\bonly you understand\b/i,
  /\bdon't leave\b/i,
  /\bi need you\b/i,
  /\byou understand me better than anyone\b/i,
];

const GUARDED_PATTERNS = [
  /\bstay with me\b/i,
  /\bi need to keep talking to you\b/i,
  /\bcan i rely on you\b/i,
  /\byou get me\b/i,
];

export function detectEmotionalSubstitutionRisk(text: string): RelationalBoundaryRisk {
  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(text))) {
    return "elevated";
  }

  if (GUARDED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "guarded";
  }

  return "low";
}
