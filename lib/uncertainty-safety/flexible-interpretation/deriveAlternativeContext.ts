import type { VariabilityContext } from "../types";

export function deriveAlternativeContext(context: VariabilityContext) {
  if (context.level === "high") {
    return "A shorter time range, daily stress, or temporary strain may also be affecting this view.";
  }

  if (context.level === "moderate") {
    return "Shorter time ranges can fluctuate more than longer-term patterns.";
  }

  return "Single days do not always reflect a broader pattern.";
}
