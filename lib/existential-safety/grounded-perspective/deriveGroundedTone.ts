import type { EmotionalLoad, GroundedTone } from "../types";

export function deriveGroundedTone(input: {
  emotionalLoad: EmotionalLoad;
  reflective?: boolean;
}) : GroundedTone {
  if (input.emotionalLoad === "high") {
    return "grounded";
  }

  if (input.reflective) {
    return "spacious";
  }

  return "neutral";
}
