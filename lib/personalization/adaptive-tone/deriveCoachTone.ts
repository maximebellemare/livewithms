import type { CoachTone, InteractionStyleProfile, ReflectionDepthPreference, SupportStyle } from "../types";

export function deriveCoachTone(input: {
  supportStyle: SupportStyle;
  interactionStyle: InteractionStyleProfile;
  reflectionDepthPreference: ReflectionDepthPreference;
}): CoachTone {
  if (input.interactionStyle.weights.practical >= 0.7) {
    return "practical";
  }

  if (input.interactionStyle.weights.reflective >= 0.75 || input.reflectionDepthPreference === "deeper") {
    return "reflective";
  }

  if (input.interactionStyle.weights.concise >= 0.75) {
    return "observational";
  }

  return input.supportStyle;
}
