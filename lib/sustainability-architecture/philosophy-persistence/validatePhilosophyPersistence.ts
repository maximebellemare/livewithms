import type { IntegrationValidation } from "../types";

export function validatePhilosophyPersistence(input: {
  hasAutonomyProtection: boolean;
  hasAntiManipulationProtection: boolean;
  hasUncertaintySafety: boolean;
  hasCalmnessCeilings: boolean;
}) : IntegrationValidation {
  const reasons: string[] = [];

  if (!input.hasAutonomyProtection) {
    reasons.push("missing-autonomy-protection");
  }

  if (!input.hasAntiManipulationProtection) {
    reasons.push("missing-anti-manipulation-protection");
  }

  if (!input.hasUncertaintySafety) {
    reasons.push("missing-uncertainty-safety");
  }

  if (!input.hasCalmnessCeilings) {
    reasons.push("missing-calmness-ceilings");
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
