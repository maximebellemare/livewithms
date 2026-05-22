import type { EthicalGrowthPolicy } from "../types";

export function deriveEthicalGrowthPolicies(): EthicalGrowthPolicy[] {
  return [
    {
      key: "ethical-monetization",
      required: ["transparent billing", "calm subscription language", "respectful restore flows"],
      blocked: ["urgency pricing", "fear-based upsells", "conversion pressure"],
    },
    {
      key: "humane-growth",
      required: ["trust-led retention", "low-pressure reminders", "bounded notifications"],
      blocked: ["emotional dependency", "addictive engagement", "manipulative retention"],
    },
    {
      key: "category-leadership-preservation",
      required: ["calmness review", "anti-drift review", "accessibility review"],
      blocked: ["self-help culture", "productivity culture", "overstimulating wellness UX"],
    },
  ];
}
