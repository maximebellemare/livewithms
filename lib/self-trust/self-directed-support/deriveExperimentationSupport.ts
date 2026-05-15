import type { SelfTrustAdaptiveState } from "../types";

export function deriveExperimentationSupport(adaptiveStatePrimary: SelfTrustAdaptiveState) {
  if (adaptiveStatePrimary === "REFLECTIVE") {
    return "If something here feels useful, you can try it lightly and keep what fits.";
  }

  return "Small adjustments can stay flexible rather than needing a fixed plan.";
}
