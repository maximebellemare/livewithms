import type { CommunityDensity } from "../types";

export function reduceCommunityDensity(fatigue: "low" | "moderate" | "high"): CommunityDensity {
  if (fatigue === "high") {
    return "minimal";
  }

  if (fatigue === "moderate") {
    return "light";
  }

  return "open";
}
