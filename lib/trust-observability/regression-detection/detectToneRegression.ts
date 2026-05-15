import type { PhilosophyTelemetry } from "../types";

export function detectToneRegression(texts: string[]): PhilosophyTelemetry {
  const reasons = texts.flatMap((text) => [
    /\bclearly\b/i.test(text) ? "certainty-regression" : null,
    /\bdefinitely\b/i.test(text) ? "confidence-regression" : null,
    /\bstay strong\b/i.test(text) ? "forced-positivity-regression" : null,
  ]).filter(Boolean) as string[];

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
