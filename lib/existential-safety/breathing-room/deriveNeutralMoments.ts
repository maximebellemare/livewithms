import type { EmotionalLoad } from "../types";

export function deriveNeutralMoments(emotionalLoad: EmotionalLoad) {
  if (emotionalLoad !== "high") {
    return null;
  }

  return {
    title: "Keep this moment simple",
    body: "You do not need to make meaning out of everything right now.",
  };
}
