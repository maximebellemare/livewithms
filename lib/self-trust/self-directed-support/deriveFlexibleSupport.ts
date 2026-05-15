import type { SelfTrustAdaptiveState } from "../types";

export function deriveFlexibleSupport(adaptiveStatePrimary: SelfTrustAdaptiveState) {
  if (adaptiveStatePrimary === "LOW_ENERGY" || adaptiveStatePrimary === "OVERWHELMED") {
    return "You can keep this simple and use only what feels helpful right now.";
  }

  return "You can use these patterns as a gentle reference, not a rule.";
}
