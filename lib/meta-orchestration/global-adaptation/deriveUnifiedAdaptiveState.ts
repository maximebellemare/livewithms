export function deriveUnifiedAdaptiveState(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  reflectionCount: number;
  hasAiVisible: boolean;
}) {
  const preserveCalmness =
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.burden === "high";

  return {
    primary: input.adaptiveStatePrimary,
    preserveCalmness,
    preferNeutralBridge:
      preserveCalmness || (input.hasAiVisible && input.reflectionCount > 0),
    allowDepth: input.adaptiveStatePrimary === "REFLECTIVE" && input.burden === "low",
  };
}
