import type { AllowedGrowthPattern } from "../types";

export function deriveAllowedGrowthPatterns(): AllowedGrowthPattern[] {
  return [
    {
      key: "trust-led-retention",
      allowed: true,
      reason: "Growth can increase through usefulness, calmness, steadiness, and lower-friction difficult days.",
    },
    {
      key: "partnership-led-discovery",
      allowed: true,
      reason: "Partnerships are acceptable when they preserve emotional restraint and do not introduce pressure-heavy funnels.",
    },
    {
      key: "addictive-engagement-mechanics",
      allowed: false,
      reason: "Growth must not rely on streaks, urgency loops, dopamine-oriented notifications, or emotional stickiness.",
    },
    {
      key: "emotionally-invasive-personalization",
      allowed: false,
      reason: "Growth must not depend on profiling users psychologically or intensifying emotional vulnerability.",
    },
  ];
}
