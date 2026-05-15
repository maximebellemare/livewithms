import type { EducationalLoad } from "../types";

export function deriveEducationalLoad(input: {
  fatigue?: number | null;
  stress?: number | null;
  sleepHours?: number | null;
  brainFog?: number | null;
}) : EducationalLoad {
  const score =
    ((input.fatigue ?? 0) >= 4 ? 2 : (input.fatigue ?? 0) >= 3 ? 1 : 0) +
    ((input.stress ?? 0) >= 4 ? 2 : (input.stress ?? 0) >= 3 ? 1 : 0) +
    ((input.brainFog ?? 0) >= 4 ? 2 : (input.brainFog ?? 0) >= 3 ? 1 : 0) +
    ((input.sleepHours ?? 8) < 6 ? 1 : 0);

  if (score >= 5) {
    return "high";
  }

  if (score >= 2) {
    return "moderate";
  }

  return "low";
}
