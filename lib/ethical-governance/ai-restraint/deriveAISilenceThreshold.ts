import type { AiTrustAdaptiveState } from "../../ai-trust/types";
import type { AISilenceThreshold, EthicalDriftRisk } from "../types";

export function deriveAISilenceThreshold(input: {
  adaptiveStatePrimary: AiTrustAdaptiveState;
  emotionalLoad: "low" | "moderate" | "high";
  driftRisk: EthicalDriftRisk;
}) : AISilenceThreshold {
  if (input.driftRisk === "elevated" || input.emotionalLoad === "high") {
    return {
      shouldReducePresence: true,
      maxSuggestionCount: 1,
      transparencyOnly: true,
    };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED" || input.driftRisk === "guarded") {
    return {
      shouldReducePresence: true,
      maxSuggestionCount: 2,
      transparencyOnly: false,
    };
  }

  return {
    shouldReducePresence: false,
    maxSuggestionCount: 3,
    transparencyOnly: false,
  };
}
