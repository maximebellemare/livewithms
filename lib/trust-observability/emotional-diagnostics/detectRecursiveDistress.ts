import type { EmotionalRiskPattern } from "../types";

export function detectRecursiveDistress(text: string): EmotionalRiskPattern {
  const lowered = text.toLowerCase();
  const reasons = [
    lowered.includes("keeps getting worse") ? "worsening-loop" : null,
    lowered.includes("nothing is helping") ? "helpeless-loop" : null,
    lowered.includes("everything feels harder") ? "globalized-distress" : null,
  ].filter(Boolean) as string[];

  return {
    risk: reasons.length >= 2 ? "elevated" : reasons.length === 1 ? "guarded" : "low",
    reasons,
  };
}
