export function deriveOfflineOrientation(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  hasRecursiveCheckingRisk: boolean;
}) {
  return {
    shouldReinforceSteppingAway:
      input.hasRecursiveCheckingRisk ||
      input.adaptiveStatePrimary === "LOW_ENERGY" ||
      input.adaptiveStatePrimary === "OVERWHELMED",
    note:
      input.hasRecursiveCheckingRisk || input.adaptiveStatePrimary === "OVERWHELMED"
        ? "Stepping away for a while can also be valuable."
        : input.adaptiveStatePrimary === "LOW_ENERGY"
          ? "You may not need to analyze this further right now."
          : null,
  };
}
