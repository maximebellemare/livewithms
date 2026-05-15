import type { AIOverpresencePlan, OverinterpretationRisk } from "../types";

export function reduceAIOverpresence(input: {
  overinterpretationRisk: OverinterpretationRisk;
  requestedSuggestionCount: number;
}) : AIOverpresencePlan {
  if (input.overinterpretationRisk === "elevated") {
    return {
      maxSuggestionCount: Math.min(input.requestedSuggestionCount, 1),
      showPerspectiveNote: true,
      suppressExtraPrompt: true,
    };
  }

  if (input.overinterpretationRisk === "guarded") {
    return {
      maxSuggestionCount: Math.min(input.requestedSuggestionCount, 2),
      showPerspectiveNote: true,
      suppressExtraPrompt: false,
    };
  }

  return {
    maxSuggestionCount: input.requestedSuggestionCount,
    showPerspectiveNote: false,
    suppressExtraPrompt: false,
  };
}
