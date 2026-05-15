import type { PromptStylePreference } from "../types";
import type { InteractionStyleProfile } from "../types";

export function derivePromptStylePreference(interactionStyle: InteractionStyleProfile): PromptStylePreference {
  if (interactionStyle.weights.structured >= 0.72 || interactionStyle.weights.practical >= 0.72) {
    return "structured";
  }

  if (interactionStyle.weights.openEnded >= 0.72 || interactionStyle.weights.reflective >= 0.72) {
    return "open-ended";
  }

  return "gentle-observational";
}
