import type { PerpetualRefinementValidation } from "../types";

export function validateInnovationNecessity(input: {
  solvesAccessibilityNeed: boolean;
  reducesComplexity: boolean;
  drivenByTrendPressure: boolean;
}) : PerpetualRefinementValidation {
  const valid =
    (input.solvesAccessibilityNeed || input.reducesComplexity) && !input.drivenByTrendPressure;

  return {
    valid,
    reasons: valid ? [] : ["innovation-necessity-failure"],
  };
}
