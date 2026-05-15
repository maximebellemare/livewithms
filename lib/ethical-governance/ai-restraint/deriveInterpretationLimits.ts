import type { AiTrustAdaptiveState } from "../../ai-trust/types";
import type { EthicalDriftRisk, InterpretationLimits } from "../types";

export function deriveInterpretationLimits(input: {
  adaptiveStatePrimary: AiTrustAdaptiveState;
  driftRisk: EthicalDriftRisk;
}) : InterpretationLimits {
  if (input.driftRisk === "elevated" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return {
      maxInterpretiveSentences: 2,
      preserveAmbiguity: true,
      suppressExtraMeaning: true,
    };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return {
      maxInterpretiveSentences: 3,
      preserveAmbiguity: true,
      suppressExtraMeaning: false,
    };
  }

  return {
    maxInterpretiveSentences: 4,
    preserveAmbiguity: true,
    suppressExtraMeaning: false,
  };
}
