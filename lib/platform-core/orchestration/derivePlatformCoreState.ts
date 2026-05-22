import { deriveAdaptiveExperience } from "../../adaptive-intelligence";
import { deriveCalmLifeSupport } from "../../calm-life-support";
import { derivePlatformGovernance } from "../../platform-governance";
import { deriveAnalyticsGovernance } from "../analytics-governance/deriveAnalyticsGovernance";
import { derivePlatformAccessibilityRules } from "../accessibility/derivePlatformAccessibilityRules";
import { derivePlatformCalmnessConstraints } from "../calm-environment/derivePlatformCalmnessConstraints";
import { validatePlatformContent } from "../content-governance/validatePlatformContent";
import { deriveSafeExpansionRules } from "../future-expansion/deriveSafeExpansionRules";
import { derivePlatformOperationalResilience } from "../operational-resilience/derivePlatformOperationalResilience";
import { deriveFutureGovernancePolicies } from "../platform-rules/deriveFutureGovernancePolicies";
import { derivePremiumGovernance } from "../premium-orchestration/derivePremiumGovernance";
import { derivePlatformQualityAudits } from "../quality-audits/derivePlatformQualityAudits";
import { deriveSupportDensityLimits } from "../support-density/deriveSupportDensityLimits";
import type { PlatformCoreInput, PlatformCoreState } from "../types";

export function derivePlatformCoreState(input: PlatformCoreInput): PlatformCoreState {
  const adaptive = deriveAdaptiveExperience({
    ...input,
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
  });
  const calmLifeSupport = deriveCalmLifeSupport({
    ...input,
    hasPremiumAccess: input.hasPremiumAccess ?? true,
    featureEnabled: input.featureEnabled ?? true,
  });

  return {
    governance: derivePlatformGovernance(input),
    adaptive,
    calmLifeSupport,
    calmness: derivePlatformCalmnessConstraints(input),
    supportDensity: deriveSupportDensityLimits(input),
    premium: derivePremiumGovernance(),
    analytics: deriveAnalyticsGovernance(),
    content: validatePlatformContent(input),
    operationalResilience: derivePlatformOperationalResilience(input),
    accessibility: derivePlatformAccessibilityRules(input),
    futureExpansionRules: deriveSafeExpansionRules(),
    futureGovernancePolicies: deriveFutureGovernancePolicies(),
    qualityAudit: derivePlatformQualityAudits(input),
  };
}
