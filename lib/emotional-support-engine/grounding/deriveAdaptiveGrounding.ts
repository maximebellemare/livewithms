import { guardEmotionalSupportCopy } from "../governance/guardEmotionalSafety";
import { deriveSupportIntensity } from "../overwhelm/deriveSupportIntensity";
import type { AdaptiveGroundingState, EmotionalSupportEngineInput } from "../types";

export function deriveAdaptiveGrounding(input: EmotionalSupportEngineInput): AdaptiveGroundingState {
  const intensity = deriveSupportIntensity(input);
  const message = (input.message ?? "").toLowerCase();
  const futureHeavy = /\bfuture\b|\bwhat if\b|\bwhat happens next\b|\bunknown\b/.test(message);

  if (intensity.primaryState === "grounding") {
    return {
      surfaceGroundingFirst: true,
      reduceFutureIntensity: futureHeavy,
      simplifyInteractions: true,
      supportPriority: ["grounding", "decompression", "pacing", "steady"],
      primaryRecommendation: "grounding",
    };
  }

  if (intensity.primaryState === "uncertainty") {
    return {
      surfaceGroundingFirst: true,
      reduceFutureIntensity: true,
      simplifyInteractions: intensity.level !== "steady",
      supportPriority: ["uncertainty", "grounding", "pacing", "steady"],
      primaryRecommendation: "smaller-horizon",
    };
  }

  if (intensity.primaryState === "recovery") {
    return {
      surfaceGroundingFirst: false,
      reduceFutureIntensity: futureHeavy,
      simplifyInteractions: true,
      supportPriority: ["recovery", "pacing", "grounding", "steady"],
      primaryRecommendation: "steadiness",
    };
  }

  return {
    surfaceGroundingFirst: intensity.level !== "steady",
    reduceFutureIntensity: futureHeavy,
    simplifyInteractions: intensity.level !== "steady",
    supportPriority: ["pacing", "grounding", "steady"],
    primaryRecommendation: intensity.level === "steady" ? "steadiness" : "decompression",
  };
}

export function deriveAdaptiveGroundingLine(input: EmotionalSupportEngineInput) {
  const state = deriveAdaptiveGrounding(input);

  if (state.primaryRecommendation === "grounding") {
    return guardEmotionalSupportCopy("Grounding can come first while everything feels sharper.");
  }

  if (state.primaryRecommendation === "smaller-horizon") {
    return guardEmotionalSupportCopy("Keeping the horizon smaller may help this feel less consuming.");
  }

  if (state.primaryRecommendation === "decompression") {
    return guardEmotionalSupportCopy("A quieter pace may help the emotional carryover settle.");
  }

  return guardEmotionalSupportCopy("Steadier pacing may help more than asking the whole picture to resolve.");
}
