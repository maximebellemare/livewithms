export type EthicalAggregationThresholds = {
  minimumCohortSize: number;
  minimumResearchCohortSize: number;
  precision: "coarse";
  retainFreeText: false;
};

export type PopulationPatternInput = {
  topic?: "fatigue" | "pacing" | "accessibility" | "calmness";
  dominantPattern?: string;
  cohortSize?: number;
};

export type ResearchUseCase =
  | "accessibility-study"
  | "fatigue-support-study"
  | "calmness-improvement"
  | "support-quality-review";

export type ResearchParticipation = {
  summary: string;
  lines: string[];
  useCases: ResearchUseCase[];
  requiresOptIn: true;
  revocable: true;
};

export type CalmMetric = {
  name: string;
  purpose: string;
};
