import { ENERGY_AWARE_DEFAULTS } from "../constants";

export function detectInteractionFatigue(input: {
  interactionFrequency: number;
  fatigueLevel: number | null;
  repeatedSkippedPrompts?: number;
}) {
  return (
    input.interactionFrequency >= ENERGY_AWARE_DEFAULTS.interactionFatigueThreshold ||
    (input.fatigueLevel ?? 0) >= ENERGY_AWARE_DEFAULTS.elevatedFatigue ||
    (input.repeatedSkippedPrompts ?? 0) >= 2
  );
}
