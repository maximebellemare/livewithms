import type { PlatformFutureGovernancePolicy } from "../types";

export function deriveFutureGovernancePolicies(): PlatformFutureGovernancePolicy[] {
  return [
    {
      key: "preflight-safety-review",
      requiredChecks: ["emotional-safety", "adaptive-boundaries", "support-density", "accessibility"],
      blockedDirections: ["therapy-simulation", "ai-companion", "manipulative-retention"],
    },
    {
      key: "premium-integrity",
      requiredChecks: ["low-pressure-positioning", "respectful-locked-state", "billing-clarity"],
      blockedDirections: ["fear-based-upsell", "urgency-copy", "feature-overwhelm"],
    },
    {
      key: "content-and-programs",
      requiredChecks: ["calmness-review", "interruption-safety", "fatigue-readability"],
      blockedDirections: ["self-help-culture", "wellness-performance", "productivity-pressure"],
    },
  ];
}
