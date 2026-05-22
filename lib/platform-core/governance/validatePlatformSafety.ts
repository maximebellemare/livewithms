import { validateAutonomyPreservation } from "../../ethical-governance/philosophy-validation/validateAutonomyPreservation";
import { validateProductPhilosophy } from "../../ethical-governance/philosophy-validation/validateProductPhilosophy";
import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreInput } from "../types";

export function validatePlatformSafety(input: PlatformCoreInput) {
  const governance = derivePlatformGovernance(input);
  const message = input.message ?? "";
  const philosophy = validateProductPhilosophy(message);
  const autonomy = validateAutonomyPreservation(message);

  return {
    valid: governance.emotionalSafety.valid && philosophy.valid && autonomy.valid,
    governance,
    reasons: [
      ...governance.emotionalSafety.reasons,
      ...(philosophy.valid ? [] : philosophy.reasons),
      ...(autonomy.valid ? [] : autonomy.reasons),
    ],
  };
}
