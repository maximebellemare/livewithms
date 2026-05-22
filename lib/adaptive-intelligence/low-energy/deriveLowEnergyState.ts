import { deriveEmotionalSupportState, guardEmotionalSupportCopy } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput, AdaptiveLowEnergyState } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveLowEnergyState(input: AdaptiveIntelligenceInput): AdaptiveLowEnergyState {
  const state = deriveEmotionalSupportState({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
  const active = Boolean(input.lowEnergyModeEnabled) || state.cognitiveLoad.level === "active";

  if (active) {
    return {
      active: true,
      title: "Gentler adaptive support",
      body: guardEmotionalSupportCopy(
        "The app can keep things quieter, shorter, and lower-pressure during heavier stretches.",
      ),
    };
  }

  return {
    active: false,
    title: "Adaptive support is available",
    body: guardEmotionalSupportCopy(
      "The app can gently simplify things when a calmer pace would help.",
    ),
  };
}
