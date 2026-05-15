import type {
  AdaptiveState,
  AdaptiveStateSignal,
  LongitudinalAnalysis,
  LongitudinalEntry,
  LongitudinalMetricKey,
  LongitudinalObservation,
} from "../longitudinal/types";
import type { LifecycleStage } from "../../features/lifecycle/logic";
import type { SupportStyle } from "../../features/personalization-memory/types";

export type ReflectionCardKind =
  | "gentle-observation"
  | "quiet-win"
  | "calming-continuity"
  | "pacing-reinforcement"
  | "emotional-awareness"
  | "resilience-reflection";

export type ReflectionCardTone = "light" | "steady" | "deeper";

export type ReflectionSurfaceCard = {
  id: string;
  kind: ReflectionCardKind;
  title: string;
  body: string;
  source: "longitudinal" | "quiet-win" | "continuity";
  relatedMetrics: LongitudinalMetricKey[];
  tone: ReflectionCardTone;
  confidence: "light" | "moderate";
  recencyDays: number | null;
  emotionalUsefulness: number;
  timingScore: number;
  repetitionKey: string;
};

export type ReflectionTimingInput = {
  adaptiveState: AdaptiveState;
  fatigueLevel: number | null;
  timeOfDay: number;
  sessionLengthSeconds: number;
  interactionFrequency: number;
  skippedCheckIns: number;
};

export type ReflectionTiming = {
  shouldDisplay: boolean;
  maxCards: 0 | 1 | 2;
  maxLength: "short" | "medium";
  suppressHeavierCards: boolean;
  preferContinuity: boolean;
  allowDeeperReflection: boolean;
  densityKey: "minimal" | "focused" | "roomy";
};

export type QuietWinSignal =
  | "returning-after-absence"
  | "emotional-honesty"
  | "gentle-pacing"
  | "improved-consistency"
  | "reduced-self-criticism"
  | "calmer-reflections";

export type ReflectionSelectionInput = {
  entries: LongitudinalEntry[];
  analysis: LongitudinalAnalysis;
  adaptiveState: AdaptiveState;
  timeOfDay: number;
  sessionLengthSeconds?: number;
  skippedCheckIns?: number;
  recentCardIds?: string[];
  lifecycleStage?: LifecycleStage;
  preferredSupportStyle?: SupportStyle | null;
};

export type ObservationRankingContext = {
  adaptiveState: AdaptiveStateSignal;
  timing: ReflectionTiming;
  preferredSupportStyle?: SupportStyle | null;
};

export type LongitudinalObservationCandidateInput = {
  observation: LongitudinalObservation;
  adaptiveState: AdaptiveState;
};
