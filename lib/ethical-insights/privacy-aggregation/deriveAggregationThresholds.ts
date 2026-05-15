import type { EthicalAggregationThresholds } from "../types";

export function deriveAggregationThresholds(): EthicalAggregationThresholds {
  return {
    minimumCohortSize: 24,
    minimumResearchCohortSize: 50,
    precision: "coarse",
    retainFreeText: false,
  };
}
