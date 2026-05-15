export function deriveProductContinuity(input: {
  philosophyValid: boolean;
  drifted: boolean;
  knownRiskPatternCount: number;
}) {
  return {
    stable: input.philosophyValid && !input.drifted,
    continuityNote:
      input.philosophyValid && !input.drifted
        ? "Current evolution remains aligned with earlier calmness and autonomy goals."
        : "Recent signals suggest future changes should re-anchor to earlier philosophy decisions.",
    requiresHistoricalReview: input.drifted || input.knownRiskPatternCount > 1,
  };
}
