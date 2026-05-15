import type { AtmosphereState, EmotionalDensity } from "../types";

export function deriveEmotionalDensity(input: {
  atmosphere: AtmosphereState;
  hasStackedEmotionalSurfaces: boolean;
  reflectionCount: number;
}): EmotionalDensity {
  if (input.atmosphere === "QUIET" || input.atmosphere === "RESTORATIVE" || input.hasStackedEmotionalSurfaces) {
    return "SPARSE";
  }

  if (input.atmosphere === "REFLECTIVE" && input.reflectionCount > 0) {
    return "RICH";
  }

  return "BALANCED";
}

