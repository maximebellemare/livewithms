import type { OverinterpretationRisk, SelfTrustAdaptiveState } from "../types";

export function deriveIntuitionSupport(input: {
  adaptiveStatePrimary: SelfTrustAdaptiveState;
  overinterpretationRisk: OverinterpretationRisk;
}) {
  if (input.overinterpretationRisk === "elevated") {
    return "Not every fluctuation needs interpretation right away.";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "Your own read on what feels manageable today matters too.";
  }

  return "Your experience may include nuances that simple patterns cannot fully capture.";
}
