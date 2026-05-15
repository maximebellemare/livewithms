import type { PassiveAdaptiveState } from "../types";

export function derivePassiveContext(input: {
  adaptiveStatePrimary: PassiveAdaptiveState;
  sleepHours?: number | null;
  stepCount?: number | null;
  heartRateContext?: "steady" | "elevated" | null;
}) {
  const quieterDay =
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    (input.sleepHours ?? 8) < 6 ||
    input.heartRateContext === "elevated";

  const movementLighter = (input.stepCount ?? 6000) < 3500;

  return {
    quieterDay,
    movementLighter,
    summary: quieterDay
      ? "Passive context suggests a quieter day may help."
      : movementLighter
        ? "Movement has looked lighter, so a softer pace may still be useful."
        : "Passive context can stay in the background and only simplify things when helpful.",
  };
}
