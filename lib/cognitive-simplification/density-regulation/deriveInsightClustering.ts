import type { CognitiveBurden, DisclosureDepth, InsightClustering } from "../types";

export function deriveInsightClustering(input: {
  burden: CognitiveBurden;
  disclosureDepth: DisclosureDepth;
}): InsightClustering {
  if (input.disclosureDepth === "minimal" || input.burden === "high") {
    return {
      maxCorrelations: 1,
      showProgressSummary: false,
      showBestWorstDay: false,
      maxAiSuggestionItems: 2,
    };
  }

  if (input.disclosureDepth === "expanded") {
    return {
      maxCorrelations: 3,
      showProgressSummary: true,
      showBestWorstDay: true,
      maxAiSuggestionItems: 4,
    };
  }

  return {
    maxCorrelations: 2,
    showProgressSummary: true,
    showBestWorstDay: false,
    maxAiSuggestionItems: 3,
  };
}
