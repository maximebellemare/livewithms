import { preventReidentification } from "../privacy-aggregation/preventReidentification";

export function deriveAccessibilityInsights() {
  return [
    "Aggregated patterns can show when shorter reflections and lower-density screens are easier to use.",
    "Grouped accessibility signals can help the app reduce burden during fatigue, brain fog, or visual strain.",
    preventReidentification(
      "These insights stay broad and are used to improve calmer design choices rather than to study any specific person.",
    ),
  ];
}
