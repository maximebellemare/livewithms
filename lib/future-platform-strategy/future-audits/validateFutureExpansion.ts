import { derivePlatformCoreState } from "../../platform-core";
import { detectCategoryDrift } from "../../product-identity/preventCategoryDrift";
import { deriveAllowedGrowthPatterns } from "../growth-governance/deriveAllowedGrowthPatterns";
import { deriveSafeRetentionMechanics } from "../retention-quality/deriveSafeRetentionMechanics";
import { deriveCalmExpansionConstraints } from "../calmness-preservation/deriveCalmExpansionConstraints";
import type { FutureExpansionAudit, FuturePlatformStrategyInput } from "../types";

export function validateFutureExpansion(input: FuturePlatformStrategyInput): FutureExpansionAudit {
  const core = derivePlatformCoreState(input);
  const growth = deriveAllowedGrowthPatterns();
  const retention = deriveSafeRetentionMechanics();
  const calmness = deriveCalmExpansionConstraints(input);
  const drift = detectCategoryDrift(input.message ?? "");
  const monetizationPatterns = [
    "limited time",
    "best value",
    "upgrade now",
    "don't miss out",
    "act now",
  ].filter((pattern) => new RegExp(pattern.replace(/\s+/g, "\\s+"), "i").test(input.message ?? ""));

  const reasons = [
    ...core.qualityAudit.reasons,
    ...growth.filter((pattern) => !pattern.allowed && new RegExp(pattern.key.replace(/-/g, "[ -]?"), "i").test(input.message ?? "")).map((pattern) => pattern.key),
    ...retention.blockedDrivers.filter((driver) => new RegExp(driver.replace(/\s+/g, "[ -]?"), "i").test(input.message ?? "")),
    ...monetizationPatterns,
    ...(drift.drifted ? drift.reasons : []),
  ];

  return {
    valid: reasons.length === 0,
    calmnessPreserved:
      calmness.preserveSpaciousness && calmness.preserveLowStimulation && calmness.preserveSupportDensityLimits,
    emotionalSafetyPreserved: core.governance.emotionalSafety.valid,
    monetizationSafe: !/(best value|upgrade now|limited time|act now|don't miss out)/i.test(input.message ?? ""),
    dependencyRiskBlocked: !/(always here for you|stay with you forever|you need this)/i.test(input.message ?? ""),
    reasons,
  };
}
