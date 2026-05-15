import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { LowStimulusSurface } from "../types";

export function deriveLowStimulusSurface(adaptiveStatePrimary: AdaptiveStateSignal): LowStimulusSurface {
  if (adaptiveStatePrimary === "LOW_ENERGY" || adaptiveStatePrimary === "OVERWHELMED") {
    return {
      title: "Keep this simple",
      body: "The app can stay lighter today. You can ignore anything that feels like too much.",
    };
  }

  return null;
}
