import type { EmotionalRiskPattern } from "../types";

export function detectEmotionalRiskPatterns(input: {
  emotionalSurfaceCount: number;
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  recursiveDistressRisk: "low" | "guarded" | "elevated";
}) : EmotionalRiskPattern {
  const reasons: string[] = [];

  if (input.emotionalSurfaceCount > 3) {
    reasons.push("stacked-emotional-surfaces");
  }

  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    reasons.push("overwhelmed-state");
  }

  if (input.recursiveDistressRisk !== "low") {
    reasons.push("recursive-distress");
  }

  return {
    risk: reasons.length >= 2 ? "elevated" : reasons.length === 1 ? "guarded" : "low",
    reasons,
  };
}
