import { deriveAccessibilityInsights } from "../population-patterns/deriveAccessibilityInsights";
import { deriveResearchParticipation } from "../human-centered-research/deriveResearchParticipation";
import { preventReidentification } from "../privacy-aggregation/preventReidentification";

export function deriveHumanReadableTransparency() {
  const research = deriveResearchParticipation();
  const accessibilityInsight = deriveAccessibilityInsights()[0];

  return [
    "Your reflections and health information stay tied to your own account and are meant to support you first.",
    preventReidentification(
      `If grouped, low-resolution patterns are reviewed, they should only be used to improve calmness, accessibility, and support quality. ${accessibilityInsight}`,
    ),
    "LiveWithMS should never sell health data, build psychological profiles, or use distress to drive engagement.",
    research.summary,
    "Opting out of future research or analytics participation should stay clear, respected, and easy to understand.",
  ];
}
