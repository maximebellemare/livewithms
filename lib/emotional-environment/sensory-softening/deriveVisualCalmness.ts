import type { SensoryIntensity } from "../types";

export function deriveVisualCalmness(intensity: SensoryIntensity) {
  return {
    softenContrast: intensity === "LOW",
    preferBreathingRoom: true,
    lowerPromptIntensity: intensity === "LOW",
  };
}

