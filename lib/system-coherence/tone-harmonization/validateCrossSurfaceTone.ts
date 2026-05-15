import type { CoherenceTone } from "../types";

export function validateCrossSurfaceTone(tones: CoherenceTone[]) {
  const uniqueTones = Array.from(new Set(tones));

  return {
    consistent: uniqueTones.length <= 2,
    reasons: uniqueTones.length <= 2 ? [] : ["too-many-tone-profiles"],
  };
}
