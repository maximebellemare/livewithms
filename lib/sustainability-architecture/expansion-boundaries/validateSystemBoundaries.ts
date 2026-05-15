import type { ExpansionConstraint, IntegrationValidation } from "../types";

export function validateSystemBoundaries(input: {
  constraints: ExpansionConstraint[];
  requestedTouchpoints: number;
}) : IntegrationValidation {
  const reasons = input.constraints
    .filter((constraint) => input.requestedTouchpoints > constraint.maxAdaptiveTouchpoints)
    .map((constraint) => `touchpoint-overflow:${constraint.zone}`);

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
