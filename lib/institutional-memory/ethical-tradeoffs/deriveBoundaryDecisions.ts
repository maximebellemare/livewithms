export function deriveBoundaryDecisions(input: {
  conflictSignals: number;
  hasDrift: boolean;
}) {
  return {
    preferRestraint: input.hasDrift || input.conflictSignals > 0,
    requireExplicitRationale: input.hasDrift || input.conflictSignals > 1,
    boundaryReason:
      input.hasDrift
        ? "Recent drift signals suggest stronger justification should be required."
        : input.conflictSignals > 0
          ? "Conflicting system behavior suggests caution."
          : "Current boundaries look stable.",
  };
}
