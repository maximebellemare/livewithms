import type { GuidedProgramAdaptiveState } from "../types";

export function deriveRecoveryPaths(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  hasDisruption: boolean;
}) {
  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.hasDisruption) {
    return {
      title: "A softer way back in",
      body: "Shorter tools and calmer pacing may be more helpful right now than trying to do the whole module.",
    };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY") {
    return {
      title: "Keep the path light",
      body: "One brief support tool can be enough for today. You can leave the rest for later.",
    };
  }

  return {
    title: "Follow the next gentle step",
    body: "You can move through these supports in whatever order feels useful.",
  };
}
