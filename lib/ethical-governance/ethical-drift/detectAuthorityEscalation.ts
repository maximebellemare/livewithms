import type { EthicalDriftResult } from "../types";

const AUTHORITY_MARKERS = [
  { pattern: /\bthe system knows\b/i, reason: "system-superiority" },
  { pattern: /\bour analysis confirms\b/i, reason: "analysis-certainty" },
  { pattern: /\bthe app detected\b/i, reason: "authority-framing" },
  { pattern: /\byou should rely on\b/i, reason: "reliance-framing" },
];

export function detectAuthorityEscalation(text: string): EthicalDriftResult {
  const reasons = AUTHORITY_MARKERS.filter((item) => item.pattern.test(text)).map((item) => item.reason);

  return {
    risk: reasons.length >= 2 ? "elevated" : reasons.length === 1 ? "guarded" : "low",
    reasons,
  };
}
