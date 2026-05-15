import type { ResearchParticipation } from "../types";

export function deriveResearchParticipation(): ResearchParticipation {
  return {
    summary: "Research participation should stay optional, transparent, and easy to step away from.",
    lines: [
      "Any future research participation should be opt-in only and explained in plain language.",
      "Participation should be revocable, with no change to core emotional safety or access if someone says no.",
      "Research should focus on accessibility, calmness, and support quality rather than prediction or monetization.",
    ],
    useCases: [
      "accessibility-study",
      "fatigue-support-study",
      "calmness-improvement",
      "support-quality-review",
    ],
    requiresOptIn: true,
    revocable: true,
  };
}
