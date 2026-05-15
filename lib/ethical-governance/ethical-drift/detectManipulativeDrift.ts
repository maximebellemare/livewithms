import type { EthicalDriftResult } from "../types";

const DRIFT_MARKERS = [
  { pattern: /\bwe miss you\b/i, reason: "emotional-return-pressure" },
  { pattern: /\bcome back\b/i, reason: "return-nudge" },
  { pattern: /\bdon't lose momentum\b/i, reason: "momentum-pressure" },
  { pattern: /\bstay on top of your health\b/i, reason: "control-pressure" },
  { pattern: /\brely on (me|this)\b/i, reason: "dependency-pressure" },
];

export function detectManipulativeDrift(text: string): EthicalDriftResult {
  const reasons = DRIFT_MARKERS.filter((item) => item.pattern.test(text)).map((item) => item.reason);

  return {
    risk: reasons.length >= 2 ? "elevated" : reasons.length === 1 ? "guarded" : "low",
    reasons,
  };
}
