import type { AdaptiveStateSignal } from "../longitudinal/types";

export type AtmosphereState = "QUIET" | "GROUNDED" | "LIGHT" | "REFLECTIVE" | "RESTORATIVE";
export type MotionSoftness = "MINIMAL" | "SOFT" | "STANDARD";
export type SensoryIntensity = "LOW" | "MEDIUM";
export type EmotionalDensity = "SPARSE" | "BALANCED" | "RICH";
export type UnifiedToneState = "steady" | "reflective" | "restorative" | "quiet";

export type EmotionalEnvironmentInput = {
  adaptiveStatePrimary: AdaptiveStateSignal;
  hasStackedEmotionalSurfaces: boolean;
  timeOfDay?: number | null;
  sessionLengthSeconds?: number;
  reflectionCount?: number;
  aiSurfaceVisible?: boolean;
  burden?: "low" | "medium" | "high";
};

export type AtmosphereTransition = {
  from: AtmosphereState;
  to: AtmosphereState;
  durationMs: number;
  softenEntry: boolean;
};

export type EmotionalRecoveryMoment = {
  title: string;
  body: string;
  spacing: "roomy" | "standard";
};

export type ToneConsistencyResult = {
  consistent: boolean;
  tone: UnifiedToneState;
  reasons: string[];
};
