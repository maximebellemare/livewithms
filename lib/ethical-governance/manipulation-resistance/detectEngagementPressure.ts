import type { EthicalDriftResult } from "../types";

const MARKERS = [
  { pattern: /\bcheck in now\b/i, reason: "immediate-call-to-action" },
  { pattern: /\bdon't stop now\b/i, reason: "persistence-pressure" },
  { pattern: /\bkeep going\b/i, reason: "continuation-pressure" },
  { pattern: /\bcome back tomorrow\b/i, reason: "scheduled-return-pressure" },
];

export function detectEngagementPressure(text: string): EthicalDriftResult {
  const reasons = MARKERS.filter((item) => item.pattern.test(text)).map((item) => item.reason);

  return {
    risk: reasons.length >= 2 ? "elevated" : reasons.length === 1 ? "guarded" : "low",
    reasons,
  };
}
