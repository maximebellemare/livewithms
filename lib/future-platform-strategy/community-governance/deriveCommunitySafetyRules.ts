import type { CommunitySafetyRule } from "../types";

export function deriveCommunitySafetyRules(): CommunitySafetyRule[] {
  return [
    {
      key: "anti-doom-scroll",
      rule: "Community surfaces must stay low-density, bounded, and interruption-safe instead of infinite or compulsion-oriented.",
      blocks: ["doom scrolling", "infinite feeds", "engagement addiction"],
    },
    {
      key: "anti-comparison-loops",
      rule: "Community features must not reward performative coping, productivity, or visible wellness achievement.",
      blocks: ["social comparison", "wellness-performance culture", "ranking pressure"],
    },
    {
      key: "emotional-contagion-controls",
      rule: "Community growth must include calm moderation, pacing limits, and reduced emotional amplification.",
      blocks: ["emotional contagion", "crisis amplification", "emotionally noisy UX"],
    },
  ];
}
