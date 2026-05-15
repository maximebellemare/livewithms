import type { AdaptiveFlow, AdaptiveFlowInput } from "../types";

export function deriveReturnExperience(input: AdaptiveFlowInput): AdaptiveFlow["returnExperience"] {
  if (input.lifecycleStage === "returning" || input.adaptiveState.primary === "WITHDRAWN") {
    return {
      style: "simple",
      keepPressureLow: true,
      highlightCatchUp: false,
    };
  }

  if (input.adaptiveState.primary === "REFLECTIVE") {
    return {
      style: "reflective",
      keepPressureLow: true,
      highlightCatchUp: false,
    };
  }

  return {
    style: "steady",
    keepPressureLow: true,
    highlightCatchUp: false,
  };
}
