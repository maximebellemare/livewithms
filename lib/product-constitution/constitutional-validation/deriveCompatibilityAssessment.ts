export function deriveCompatibilityAssessment(input: {
  violationCount: number;
  driftSignals: number;
}) {
  return {
    compatible: input.violationCount === 0 && input.driftSignals === 0,
    level:
      input.violationCount > 1 || input.driftSignals > 1
        ? "incompatible"
        : input.violationCount > 0 || input.driftSignals > 0
          ? "guarded"
          : "compatible",
  } as const;
}
