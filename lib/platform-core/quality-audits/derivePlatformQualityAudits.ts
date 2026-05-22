import { detectCategoryDrift } from "../../product-identity/preventCategoryDrift";
import { derivePlatformCalmnessConstraints } from "../calm-environment/derivePlatformCalmnessConstraints";
import { deriveAdaptiveBoundaries } from "../adaptive-systems/deriveAdaptiveBoundaries";
import { validatePlatformSafety } from "../governance/validatePlatformSafety";
import type { PlatformCoreInput, PlatformQualityAudit } from "../types";

export function derivePlatformQualityAudits(input: PlatformCoreInput): PlatformQualityAudit {
  const safety = validatePlatformSafety(input);
  const adaptive = deriveAdaptiveBoundaries(input);
  const calmness = derivePlatformCalmnessConstraints(input);
  const drift = detectCategoryDrift(input.message ?? "");
  const reasons = [
    ...safety.reasons,
    ...(adaptive.subtle ? [] : ["adaptation-not-subtle"]),
    ...(calmness.preserveSpaciousness ? [] : ["spaciousness-not-protected"]),
    ...(drift.drifted ? drift.reasons : []),
  ];

  return {
    ready: reasons.length === 0,
    governanceSafe: safety.valid,
    adaptiveBounded: adaptive.subtle,
    calmnessProtected: calmness.preserveSpaciousness && calmness.lowerStimulation,
    categoryIdentityProtected: !drift.drifted,
    reasons,
  };
}
