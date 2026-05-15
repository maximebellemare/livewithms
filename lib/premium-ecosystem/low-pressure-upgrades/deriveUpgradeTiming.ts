import type { UpgradePacing } from "../types";

export function deriveUpgradeTiming(input: {
  source: "profile" | "premium-screen" | "coach-limit" | "other";
  isLoading: boolean;
  hasRecentFailure: boolean;
}): UpgradePacing {
  if (input.isLoading || input.hasRecentFailure) {
    return "defer";
  }

  if (input.source === "profile") {
    return "quiet";
  }

  return "available";
}
