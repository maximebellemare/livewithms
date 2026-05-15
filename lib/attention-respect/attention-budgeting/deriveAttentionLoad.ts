import { ATTENTION_RESPECT_DEFAULTS } from "../constants";
import type { AttentionLoad } from "../types";

export function deriveAttentionLoad(input: {
  visibleSurfaceCount: number;
  actionCount: number;
  hasAiSummary: boolean;
  hasReflectionCards: boolean;
}): AttentionLoad {
  const score =
    (input.visibleSurfaceCount >= ATTENTION_RESPECT_DEFAULTS.highSurfaceThreshold ? 1 : 0) +
    (input.actionCount >= ATTENTION_RESPECT_DEFAULTS.highActionThreshold ? 1 : 0) +
    (input.hasAiSummary ? 1 : 0) +
    (input.hasReflectionCards ? 1 : 0);

  if (score >= 3) {
    return "high";
  }

  if (score >= 2) {
    return "moderate";
  }

  return "low";
}

