export function preserveCalmnessUnderFailure(input: {
  hasFailure: boolean;
  fallbackMode: "none" | "simplified" | "quiet";
}) {
  return {
    useSofterLanguage: input.hasFailure,
    preferNeutralBridge: input.hasFailure || input.fallbackMode === "quiet",
    reduceRecoveryPrompts: input.fallbackMode !== "none",
  };
}
