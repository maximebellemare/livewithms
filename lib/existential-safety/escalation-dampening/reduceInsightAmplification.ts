import type { EmotionalLoad, RecursiveDistressRisk } from "../types";

export function reduceInsightAmplification(input: {
  requestedCount: number;
  emotionalLoad: EmotionalLoad;
  recursiveDistress: RecursiveDistressRisk;
}) {
  if (input.emotionalLoad === "high" || input.recursiveDistress === "elevated") {
    return Math.min(input.requestedCount, 1);
  }

  if (input.emotionalLoad === "moderate") {
    return Math.min(input.requestedCount, 2);
  }

  return input.requestedCount;
}
