export function detectInvariantViolation(input: {
  invariantViolations: string[];
  featureViolations: string[];
}) {
  const violations = [...input.invariantViolations, ...input.featureViolations];

  return {
    violated: violations.length > 0,
    violations,
  };
}
