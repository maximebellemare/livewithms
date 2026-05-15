export type AiTrustChannel = "coach" | "insight-summary" | "insight-list-item";

export type AiTrustAdaptiveState = "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";

export type SafeResponseDepth = "brief" | "standard" | "reflective";

export type SensitiveTopic =
  | "despair"
  | "hopelessness"
  | "panic"
  | "overwhelm"
  | "shutdown"
  | "crisis"
  | "medical";

export type AiTrustInput = {
  text: string;
  channel: AiTrustChannel;
  adaptiveState?: AiTrustAdaptiveState;
  userMessage?: string | null;
  includeTransparencyNote?: boolean;
};

export type AiTrustResult = {
  text: string;
  trustNote: string | null;
  usedFallback: boolean;
  flags: {
    dependencyLanguage: boolean;
    therapyLike: boolean;
    medicalInterpretation: boolean;
    emotionalOverload: boolean;
    sensitiveTopics: SensitiveTopic[];
  };
};
