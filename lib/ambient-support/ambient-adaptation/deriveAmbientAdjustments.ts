import type { AmbientSupportIntensity } from "../types";

export function deriveAmbientAdjustments(input: {
  quieterDay: boolean;
  movementLighter: boolean;
  intensity: AmbientSupportIntensity;
}) {
  return {
    reducePromptDensity: input.quieterDay || input.intensity === "very-light",
    shortenReflections: input.quieterDay,
    lowerVisualLoad: input.movementLighter || input.quieterDay,
  };
}
