import type {
  ReminderWindow as PersonalizationReminderWindow,
  SupportStyle as PersonalizationSupportStyle,
} from "../../features/personalization-memory/types";

export type ReminderWindow = PersonalizationReminderWindow;
export type SupportStyle = PersonalizationSupportStyle;

export type InteractionStyleKey =
  | "concise"
  | "reflective"
  | "structured"
  | "openEnded"
  | "reassuranceLight"
  | "reassuranceWarm"
  | "practical"
  | "emotionallyReflective";

export type InteractionStyleWeights = Record<InteractionStyleKey, number>;

export type InteractionStyleProfile = {
  weights: InteractionStyleWeights;
  primaryStyle: InteractionStyleKey;
  confidence: number;
};

export type ReflectionDepthPreference = "brief" | "balanced" | "deeper";
export type PromptStylePreference = "structured" | "open-ended" | "gentle-observational";
export type ComplexityTolerance = "lower" | "balanced" | "higher";
export type PreferredDensity = "minimal" | "standard" | "reflective";
export type EngagementRhythm = "light" | "steady" | "sporadic";
export type RecoveryRhythm = "quick-reset" | "gradual-return" | "quiet-reentry";
export type CoachTone = SupportStyle | "observational";
export type ReflectionTone = "practical-grounding" | "emotionally-reflective" | "observational" | "gentle-encouragement" | "concise-stabilization";

export type PersonalizationPreferenceSnapshot = {
  interactionStyle: InteractionStyleProfile;
  coachTone: CoachTone;
  reflectionTone: ReflectionTone;
  preferredCheckinWindows: ReminderWindow[];
  engagementRhythm: EngagementRhythm;
  recoveryRhythm: RecoveryRhythm;
  reflectionDepthPreference: ReflectionDepthPreference;
  promptStylePreference: PromptStylePreference;
  complexityTolerance: ComplexityTolerance;
  preferredDensity: PreferredDensity;
};
