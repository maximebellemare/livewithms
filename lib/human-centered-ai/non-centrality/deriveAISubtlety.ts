import type { HumanCenteredAiState } from "../types";

export function deriveAISubtlety(input: {
  adaptiveStatePrimary: HumanCenteredAiState;
  relationalRisk: "low" | "guarded" | "elevated";
}) {
  if (input.relationalRisk === "elevated" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return {
      visibility: "quiet",
      warmth: "restrained",
    } as const;
  }

  if (input.relationalRisk === "guarded" || input.adaptiveStatePrimary === "LOW_ENERGY") {
    return {
      visibility: "subtle",
      warmth: "light",
    } as const;
  }

  return {
    visibility: "present",
    warmth: "balanced",
  } as const;
}
