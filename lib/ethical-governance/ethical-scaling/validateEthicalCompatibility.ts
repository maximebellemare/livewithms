import type { FutureExpansionConstraint, PhilosophyValidation } from "../types";

export function validateEthicalCompatibility(constraints: FutureExpansionConstraint[]): PhilosophyValidation {
  const reasons = constraints
    .filter(
      (constraint) =>
        !constraint.requiresExplicitConsent ||
        !constraint.requiresHumanSecondaryPosition ||
        !constraint.disallowPersuasionLoops,
    )
    .map((constraint) => `unsafe-expansion:${constraint.feature}`);

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
