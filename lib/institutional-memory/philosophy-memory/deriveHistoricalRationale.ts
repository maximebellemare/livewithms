export function deriveHistoricalRationale(input: {
  feature: string;
  driftSignals: string[];
}) {
  const rationale =
    input.feature === "meta-orchestration"
      ? "This layer exists to keep multiple adaptive systems from competing with one another."
      : "This feature exists to preserve calmness, autonomy, and emotional restraint over time.";

  return {
    feature: input.feature,
    rationale,
    reminder:
      input.driftSignals.length > 0
        ? "Past drift signals suggest this area should remain tightly constrained."
        : "Past rationale should remain visible when future changes are proposed.",
  };
}
