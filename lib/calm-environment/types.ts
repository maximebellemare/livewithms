import type { CalmDensityMode } from "../../features/calm-environment/types";

export type CalmEnvironmentInput = {
  hasPremiumAccess?: boolean;
  featureEnabled?: boolean;
  lowEnergyModeEnabled: boolean;
  reducedMotionPreference: boolean;
  softerHapticsPreference: boolean;
  nightCalmPreference: boolean;
  densityPreference: CalmDensityMode;
  interactionTolerance?: "reduced" | "steady";
  timeOfDay?: "morning" | "afternoon" | "evening";
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  overwhelmDetected?: boolean;
};

export type CalmEnvironmentDensity = {
  mode: CalmDensityMode;
  spacingMultiplier: number;
  maxVisibleSections: number;
  prefersShorterReading: boolean;
  label: string;
  largerTapTargets: boolean;
  simplifyHierarchy: boolean;
};

export type CalmEnvironmentReducedMotion = {
  reducedMotion: boolean;
  motionScale: number;
  feedbackDelayMs: number;
  pressFadeMs: number;
  settleMs: number;
  reduceAnimationIntensity: boolean;
  softenHaptics: boolean;
};

export type CalmEnvironmentSensoryComfort = {
  quieterPalette: boolean;
  lowerVisualNoise: boolean;
  calmerContrast: boolean;
  spaciousReading: boolean;
  softerLoadingStates: boolean;
  nightCalm: boolean;
  reducedStimulus: boolean;
};

export type CalmEnvironmentFatigueReadableLayout = {
  spaciousReading: boolean;
  lineHeightScale: number;
  reduceTextWalls: boolean;
  easierScanning: boolean;
  simplerHierarchy: boolean;
};

export type CalmEnvironmentLowEnergyPresentation = {
  active: boolean;
  shortenReading: boolean;
  reduceSimultaneousActions: boolean;
  simplifySecondaryContent: boolean;
  preserveFunctionality: boolean;
};

export type CalmEnvironmentInteractionPacing = {
  slowerTransitions: boolean;
  largerTapTargets: boolean;
  interruptionSafe: boolean;
  preserveUnfinishedState: boolean;
  calmerReentry: boolean;
};

export type CalmEnvironmentState = {
  available: boolean;
  active: boolean;
  title: string;
  body: string;
  density: CalmEnvironmentDensity;
  motion: CalmEnvironmentReducedMotion;
  sensory: CalmEnvironmentSensoryComfort;
  readability: CalmEnvironmentFatigueReadableLayout;
  lowEnergyPresentation: CalmEnvironmentLowEnergyPresentation;
  interactionPacing: CalmEnvironmentInteractionPacing;
};
