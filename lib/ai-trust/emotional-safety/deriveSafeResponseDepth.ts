import type { AiTrustAdaptiveState, SafeResponseDepth, SensitiveTopic } from "../types";

export function deriveSafeResponseDepth(
  adaptiveState: AiTrustAdaptiveState = "STABLE",
  sensitiveTopics: SensitiveTopic[] = [],
): SafeResponseDepth {
  if (
    adaptiveState === "LOW_ENERGY" ||
    adaptiveState === "OVERWHELMED" ||
    sensitiveTopics.includes("panic") ||
    sensitiveTopics.includes("overwhelm")
  ) {
    return "brief";
  }

  if (adaptiveState === "REFLECTIVE" && sensitiveTopics.length === 0) {
    return "reflective";
  }

  return "standard";
}
