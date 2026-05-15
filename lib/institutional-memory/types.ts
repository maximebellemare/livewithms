export type MemoryPriority = "low" | "moderate" | "high";

export type IntentRecord = {
  system: string;
  purpose: string;
  emotionalRationale: string;
  constraints: string[];
};

export type PhilosophyDecisionRecord = {
  key: string;
  why: string;
  protects: string[];
};

export type HistoricalFailureRecord = {
  key: string;
  pattern: string;
  impact: string;
  prevention: string;
};
