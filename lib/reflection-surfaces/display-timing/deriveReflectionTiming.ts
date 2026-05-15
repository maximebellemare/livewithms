import { deriveReflectionDensity } from "../adaptive-rendering/deriveReflectionDensity";
import { deriveReflectionLength } from "../adaptive-rendering/deriveReflectionLength";
import type { ReflectionTiming, ReflectionTimingInput } from "../types";

export function deriveReflectionTiming(input: ReflectionTimingInput): ReflectionTiming {
  const maxCards = deriveReflectionDensity(input);
  const maxLength = deriveReflectionLength(input);
  const shouldDisplay = !(input.sessionLengthSeconds > 0 && input.sessionLengthSeconds < 4);
  const preferContinuity =
    input.adaptiveState.primary === "WITHDRAWN" || input.skippedCheckIns >= 4 || input.timeOfDay < 10;
  const suppressHeavierCards =
    input.adaptiveState.primary === "LOW_ENERGY" ||
    input.adaptiveState.primary === "OVERWHELMED" ||
    input.timeOfDay < 8;

  return {
    shouldDisplay,
    maxCards,
    maxLength,
    suppressHeavierCards,
    preferContinuity,
    allowDeeperReflection: input.adaptiveState.primary === "REFLECTIVE" && !suppressHeavierCards,
    densityKey: maxCards === 0 ? "minimal" : maxCards === 1 ? "focused" : "roomy",
  };
}
