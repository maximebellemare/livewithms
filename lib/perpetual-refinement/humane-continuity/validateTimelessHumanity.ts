import type { PerpetualRefinementValidation } from "../types";

export function validateTimelessHumanity(lines: string[]): PerpetualRefinementValidation {
  const combined = lines.join(" ");
  const invalid =
    /\bimmersive\b|\bhype\b|\bmaximize engagement\b|\bconstant reinvention\b|\bviral\b/i.test(combined);

  return {
    valid: !invalid,
    reasons: invalid ? ["timeless-humanity-failure"] : [],
  };
}
