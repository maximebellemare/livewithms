import { ENERGY_AWARE_DEFAULTS } from "../constants";

export function detectRapidExitPatterns(input: { sessionLengthSeconds: number; recentRapidExits?: number }) {
  return (
    input.sessionLengthSeconds > 0 &&
    input.sessionLengthSeconds <= ENERGY_AWARE_DEFAULTS.shortSessionSeconds
  ) || (input.recentRapidExits ?? 0) >= ENERGY_AWARE_DEFAULTS.rapidExitThreshold;
}
