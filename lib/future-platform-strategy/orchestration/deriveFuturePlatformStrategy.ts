import { derivePlatformCoreState } from "../../platform-core";
import { deriveCalmExpansionConstraints } from "../calmness-preservation/deriveCalmExpansionConstraints";
import { deriveCommunitySafetyRules } from "../community-governance/deriveCommunitySafetyRules";
import { deriveContentExpansionRules } from "../content-expansion/deriveContentExpansionRules";
import { deriveEthicalGrowthPolicies } from "../ethical-growth/deriveEthicalGrowthPolicies";
import { deriveFuturePlatformBoundaries } from "../future-ai/deriveFuturePlatformBoundaries";
import { validateFutureExpansion } from "../future-audits/validateFutureExpansion";
import { deriveAllowedGrowthPatterns } from "../growth-governance/deriveAllowedGrowthPatterns";
import { deriveSafeRetentionMechanics } from "../retention-quality/deriveSafeRetentionMechanics";
import type { FuturePlatformStrategyInput, FuturePlatformStrategyState } from "../types";

export function deriveFuturePlatformStrategy(input: FuturePlatformStrategyInput): FuturePlatformStrategyState {
  return {
    platformCore: derivePlatformCoreState(input),
    growthPatterns: deriveAllowedGrowthPatterns(),
    retention: deriveSafeRetentionMechanics(),
    community: deriveCommunitySafetyRules(),
    content: deriveContentExpansionRules(),
    aiAndPlatformBoundaries: deriveFuturePlatformBoundaries(),
    calmness: deriveCalmExpansionConstraints(input),
    ethicalGrowth: deriveEthicalGrowthPolicies(),
    audit: validateFutureExpansion(input),
  };
}
