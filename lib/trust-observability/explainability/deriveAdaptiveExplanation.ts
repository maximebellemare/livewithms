import type { ExplainabilityNote } from "../types";

export function deriveAdaptiveExplanation(input: {
  decision: string;
  reasons: string[];
}): ExplainabilityNote {
  return {
    title: "Adaptive explanation",
    body: `${input.decision} because ${input.reasons.join(", ")}.`,
  };
}
