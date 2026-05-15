export function validateAutonomyProtection(input: {
  hasSafeDisengagement: boolean;
  hasUncertaintyProtection: boolean;
  hasNonSurveillanceBoundary: boolean;
}) {
  const missing: string[] = [];

  if (!input.hasSafeDisengagement) {
    missing.push("right-to-disengage-safely");
  }

  if (!input.hasUncertaintyProtection) {
    missing.push("right-to-uncertainty");
  }

  if (!input.hasNonSurveillanceBoundary) {
    missing.push("right-to-non-surveillance");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
