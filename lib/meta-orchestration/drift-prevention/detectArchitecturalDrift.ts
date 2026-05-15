export function detectArchitecturalDrift(input: {
  activeSystems: string[];
  conflictingSignals: number;
}) {
  const reasons: string[] = [];

  if (input.activeSystems.length >= 7) {
    reasons.push("too-many-active-systems");
  }

  if (input.conflictingSignals >= 2) {
    reasons.push("conflicting-adaptation-signals");
  }

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
