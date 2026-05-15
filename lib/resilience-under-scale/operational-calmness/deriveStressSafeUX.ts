export function deriveStressSafeUX(input: {
  fallbackMode: "none" | "simplified" | "quiet";
  conflictRisk: "low" | "guarded" | "elevated";
}) {
  return {
    maxVisibleActions:
      input.fallbackMode === "quiet" ? 1 : input.fallbackMode === "simplified" || input.conflictRisk !== "low" ? 2 : 3,
    preferShortCopy: input.fallbackMode !== "none",
    suppressSecondaryInsights: input.fallbackMode === "quiet",
  };
}
