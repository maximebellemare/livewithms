export type AdaptiveTrace = {
  system: string;
  decision: string;
  reason: string;
  impact: "reduce-load" | "preserve-calm" | "preserve-autonomy" | "reduce-ai-presence";
};

export type PhilosophyTelemetry = {
  drifted: boolean;
  reasons: string[];
};

export type ExplainabilityNote = {
  title: string;
  body: string;
};

export type EmotionalRiskPattern = {
  risk: "low" | "guarded" | "elevated";
  reasons: string[];
};

export type TrustIntegrityResult = {
  valid: boolean;
  reasons: string[];
};
