import type { AudioAdaptiveState } from "../types";

export function deriveVoiceCheckins(adaptiveStatePrimary: AudioAdaptiveState) {
  if (adaptiveStatePrimary === "LOW_ENERGY" || adaptiveStatePrimary === "OVERWHELMED") {
    return "A voice check-in can stay to one or two simple prompts when energy is low.";
  }

  return "Voice support works best as a short check-in, not a long conversation.";
}
