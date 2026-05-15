import type { CognitiveAttentionLoad } from "../types";

export function deriveAttentionLoad(input: {
  fatigue?: number | null;
  stress?: number | null;
  sleepHours?: number | null;
  mood?: number | null;
}) : CognitiveAttentionLoad {
  const fatigue = input.fatigue ?? 0;
  const stress = input.stress ?? 0;
  const sleepHours = input.sleepHours ?? 8;
  const mood = input.mood ?? 3;

  const score =
    (fatigue >= 4 ? 2 : fatigue >= 3 ? 1 : 0) +
    (stress >= 4 ? 2 : stress >= 3 ? 1 : 0) +
    (sleepHours < 6 ? 2 : sleepHours < 7 ? 1 : 0) +
    (mood <= 2 ? 1 : 0);

  if (score >= 4) {
    return "high";
  }

  if (score >= 2) {
    return "moderate";
  }

  return "low";
}
