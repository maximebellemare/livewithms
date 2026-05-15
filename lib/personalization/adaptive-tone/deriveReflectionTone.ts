import type { InteractionStyleProfile, ReflectionTone, SupportStyle } from "../types";

export function deriveReflectionTone(input: {
  supportStyle: SupportStyle;
  interactionStyle: InteractionStyleProfile;
}): ReflectionTone {
  if (input.interactionStyle.weights.practical >= 0.7) {
    return "practical-grounding";
  }

  if (input.interactionStyle.weights.concise >= 0.75) {
    return "concise-stabilization";
  }

  if (input.interactionStyle.weights.emotionallyReflective >= 0.75 || input.supportStyle === "reflective") {
    return "emotionally-reflective";
  }

  if (input.supportStyle === "calm") {
    return "gentle-encouragement";
  }

  return "observational";
}
