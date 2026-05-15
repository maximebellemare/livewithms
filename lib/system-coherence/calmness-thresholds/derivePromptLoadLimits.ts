import type { CoherenceAdaptiveState, CoherenceBurden } from "../types";

export function derivePromptLoadLimits(input: {
  adaptiveStatePrimary: CoherenceAdaptiveState;
  burden: CoherenceBurden;
}) {
  const intense =
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high";

  return {
    maxPromptActions: intense ? 1 : input.burden === "moderate" ? 2 : 3,
    maxAiSuggestions: intense ? 1 : input.burden === "moderate" ? 2 : 3,
    maxInterpretiveSentences: intense ? 2 : input.burden === "moderate" ? 3 : 4,
  };
}
