import type { CommunityAdaptiveState } from "../types";

export function deriveSafeDiscussionSpaces(input: {
  adaptiveStatePrimary: CommunityAdaptiveState;
  lowEnergyMode: boolean;
  hasStackedEmotionalSurfaces: boolean;
}) {
  const spaces = ["pacing", "fatigue", "sleep", "recovery"];

  if (!input.lowEnergyMode && input.adaptiveStatePrimary !== "OVERWHELMED") {
    spaces.push("cognitive-support");
  }

  return input.hasStackedEmotionalSurfaces ? spaces.slice(0, 2) : spaces.slice(0, 4);
}
