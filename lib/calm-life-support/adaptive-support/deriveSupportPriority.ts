import type { CalmLifeSupportInput, CalmLifeSupportPriority } from "../types";

export function deriveSupportPriority(input: CalmLifeSupportInput): CalmLifeSupportPriority {
  if (input.overwhelmDetected || input.stressTrend === "elevated") {
    return "grounding";
  }

  if (input.lowEnergyModeEnabled || input.fatigueTrend === "high") {
    return "low-energy";
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    return "pacing";
  }

  if ((input.message ?? "").match(/\bfuture\b|\buncertain(?:ty)?\b|\bwhat if\b/i)) {
    return "uncertainty";
  }

  if ((input.message ?? "").match(/\brebuild(?:ing)?\b|\bsurvival mode\b|\blong hard\b/i)) {
    return "rebuilding";
  }

  if ((input.message ?? "").match(/\broutine\b|\bordinary\b|\beveryday\b/i)) {
    return "ordinary-life";
  }

  return "steadiness";
}
