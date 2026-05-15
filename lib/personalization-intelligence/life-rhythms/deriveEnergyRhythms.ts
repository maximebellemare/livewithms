import type { PersonalizationAdaptiveState } from "../types";

export function deriveEnergyRhythms(input: {
  adaptiveStatePrimary: PersonalizationAdaptiveState;
  recurringFatiguePattern?: string | null;
  recurringSleepPattern?: string | null;
}) {
  const lowerEnergy =
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.recurringFatiguePattern === "high" ||
    input.recurringSleepPattern === "low";

  return {
    lowerEnergy,
    summary: lowerEnergy
      ? "Some stretches seem to call for a gentler energy rhythm."
      : "Your energy rhythm may have room for a steadier pace right now.",
  };
}
