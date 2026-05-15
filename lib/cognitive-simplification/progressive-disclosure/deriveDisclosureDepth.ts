import type { LifecycleStage } from "../../../features/lifecycle/logic";
import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { CognitiveBurden, DisclosureDepth } from "../types";

export function deriveDisclosureDepth(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  burden: CognitiveBurden;
  lifecycleStage: LifecycleStage;
}): DisclosureDepth {
  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.burden === "high"
  ) {
    return "minimal";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE" && input.lifecycleStage === "long-term") {
    return "expanded";
  }

  return "standard";
}
