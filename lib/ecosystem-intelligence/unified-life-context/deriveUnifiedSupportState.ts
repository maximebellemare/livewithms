import type { EcosystemAdaptiveState, UnifiedSupportState } from "../types";

type Input = {
  adaptiveStatePrimary: EcosystemAdaptiveState;
  fatigue?: number | null;
  stress?: number | null;
  brainFog?: number | null;
};

export function deriveUnifiedSupportState(input: Input): UnifiedSupportState {
  const heavySignals = [input.fatigue, input.stress, input.brainFog].filter((value) => typeof value === "number" && value >= 4).length;

  if (input.adaptiveStatePrimary === "OVERWHELMED" || heavySignals >= 2) {
    return {
      recommendedMode: "minimal",
      maxActions: 1,
      preferSilence: true,
      summary: "The ecosystem can help most by getting quieter and simpler right now.",
    };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return {
      recommendedMode: "steady",
      maxActions: 2,
      preferSilence: false,
      summary: "Support can stay narrow, lower-effort, and easier to move through.",
    };
  }

  return {
    recommendedMode: "supportive",
    maxActions: 2,
    preferSilence: false,
    summary: "Support can stay coordinated without trying to manage every part of the day.",
  };
}
