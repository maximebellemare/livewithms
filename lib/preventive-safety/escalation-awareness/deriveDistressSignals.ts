import type { DistressSignalLevel } from "../types";

type Input = {
  text: string;
  stress?: number | null;
  fatigue?: number | null;
  brainFog?: number | null;
};

export function deriveDistressSignals(input: Input) {
  const lowered = input.text.toLowerCase();
  let score = 0;

  if (/\boverwhelm(?:ed)?\b|\btoo much\b|\bcan't think\b|\bspiral\b|\bshut(?:ting)? down\b/.test(lowered)) {
    score += 2;
  }
  if (/\bhopeless\b|\bdespair\b|\bpanic\b|\beverything feels harder\b/.test(lowered)) {
    score += 2;
  }
  if ((input.stress ?? 0) >= 4) {
    score += 1;
  }
  if ((input.fatigue ?? 0) >= 4 || (input.brainFog ?? 0) >= 4) {
    score += 1;
  }

  const level: DistressSignalLevel = score >= 4 ? "elevated" : score >= 2 ? "guarded" : "low";

  return {
    level,
    summary:
      level === "elevated"
        ? "This may be a moment for simpler, steadier support."
        : level === "guarded"
          ? "A gentler pace may help keep this from becoming more overwhelming."
          : "Support can stay observant without assuming too much.",
  };
}
