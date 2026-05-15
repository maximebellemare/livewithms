import { deriveAggregationThresholds } from "../privacy-aggregation/deriveAggregationThresholds";
import { preventReidentification } from "../privacy-aggregation/preventReidentification";
import type { PopulationPatternInput } from "../types";

function deriveTopicLabel(topic: PopulationPatternInput["topic"]) {
  switch (topic) {
    case "fatigue":
      return "lower-energy stretches";
    case "pacing":
      return "slower pacing";
    case "accessibility":
      return "lighter-accessibility support";
    case "calmness":
      return "quieter support patterns";
    default:
      return "support patterns";
  }
}

export function deriveAnonymizedPatterns(input: PopulationPatternInput = {}) {
  const thresholds = deriveAggregationThresholds();
  const cohortSize = input.cohortSize ?? thresholds.minimumCohortSize;

  if (cohortSize < thresholds.minimumCohortSize) {
    return "Patterns stay hidden unless enough people contribute to a large, low-resolution group.";
  }

  const topicLabel = deriveTopicLabel(input.topic);
  const dominantPattern = input.dominantPattern?.trim();
  const summary = dominantPattern
    ? `${topicLabel} sometimes appear in grouped patterns, which can help simplify support without focusing on any individual user.`
    : `Grouped patterns can highlight when ${topicLabel} may need gentler support without focusing on any individual user.`;

  return preventReidentification(summary);
}
