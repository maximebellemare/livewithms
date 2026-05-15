import type { PhilosophyTelemetry } from "../types";

const DRIFT_PATTERNS = [
  { pattern: /\bwe miss you\b/i, reason: "engagement-pressure" },
  { pattern: /\bour analysis confirms\b/i, reason: "authority-certainty" },
  { pattern: /\bdon't lose momentum\b/i, reason: "momentum-pressure" },
  { pattern: /\byou need this\b/i, reason: "dependency-pressure" },
];

export function detectPhilosophyDrift(texts: string[]): PhilosophyTelemetry {
  const reasons = texts.flatMap((text) =>
    DRIFT_PATTERNS.filter((item) => item.pattern.test(text)).map((item) => item.reason),
  );

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
