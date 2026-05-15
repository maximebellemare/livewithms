import type { ReflectionTimingInput } from "../types";

export function deriveReflectionLength(input: ReflectionTimingInput): "short" | "medium" {
  if (input.adaptiveState.primary === "LOW_ENERGY" || input.adaptiveState.primary === "OVERWHELMED") {
    return "short";
  }

  if ((input.fatigueLevel ?? 0) >= 4 || input.skippedCheckIns >= 3) {
    return "short";
  }

  return input.adaptiveState.primary === "REFLECTIVE" ? "medium" : "short";
}
