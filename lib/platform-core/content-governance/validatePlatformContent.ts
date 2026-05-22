import { detectCategoryDrift, preventCategoryDrift } from "../../product-identity/preventCategoryDrift";
import { validatePlatformSafety } from "../governance/validatePlatformSafety";
import type { PlatformContentGovernance, PlatformCoreInput } from "../types";

export function validatePlatformContent(input: PlatformCoreInput): PlatformContentGovernance & { sanitizedMessage: string } {
  const message = input.message ?? "";
  const safety = validatePlatformSafety(input);
  const drift = detectCategoryDrift(message);

  return {
    safe: safety.valid && !drift.drifted,
    avoidTherapySimulation: safety.governance.ai.avoidTherapySimulation,
    avoidCompanionTone: safety.governance.ai.avoidCompanionTone,
    avoidManipulativeUrgency: safety.governance.calmness.reduceUrgency,
    categoryIdentityProtected: !drift.drifted,
    reasons: [...safety.reasons, ...(drift.drifted ? drift.reasons : [])],
    sanitizedMessage: preventCategoryDrift(message),
  };
}
