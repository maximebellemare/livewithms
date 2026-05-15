import type { ResilienceFallbackMode } from "../types";

export function deriveSimplificationFallback(input: {
  conflictRisk: "low" | "guarded" | "elevated";
  overloadRisk: "low" | "guarded" | "elevated";
  hasAiVisible: boolean;
}) {
  const mode: ResilienceFallbackMode =
    input.conflictRisk === "elevated" || input.overloadRisk === "elevated"
      ? "quiet"
      : input.conflictRisk === "guarded" || input.overloadRisk === "guarded"
        ? "simplified"
        : "none";

  return {
    mode,
    reduceReflectionCards: mode === "quiet" ? 2 : mode === "simplified" ? 1 : 0,
    reduceAiVisibility: input.hasAiVisible && mode !== "none",
    suppressOptionalActions: mode !== "none",
  };
}
