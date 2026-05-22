import {
  deriveAdaptiveDensity as deriveEnvironmentAdaptiveDensity,
  deriveCalmEnvironment,
  deriveReducedMotionLevel as deriveEnvironmentReducedMotionLevel,
  deriveSensoryComfortMode as deriveEnvironmentSensoryComfortMode,
} from "../../lib/calm-environment";
import type { CalmDensityMode } from "../calm-environment/types";

type CalmEnvironmentInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  lowEnergyModeEnabled: boolean;
  reducedMotionPreference: boolean;
  softerHapticsPreference: boolean;
  nightCalmPreference: boolean;
  densityPreference: CalmDensityMode;
  timeOfDay?: "morning" | "afternoon" | "evening";
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
};

export type CalmDensitySettings = {
  mode: CalmDensityMode;
  spacingMultiplier: number;
  maxVisibleSections: number;
  prefersShorterReading: boolean;
  label: string;
};

export type ReducedMotionSettings = {
  reducedMotion: boolean;
  motionScale: number;
  feedbackDelayMs: number;
  reduceAnimationIntensity: boolean;
  softenHaptics: boolean;
};

export type SensoryComfortSettings = {
  quieterPalette: boolean;
  lowerVisualNoise: boolean;
  calmerContrast: boolean;
  spaciousReading: boolean;
  softerLoadingStates: boolean;
  nightCalm: boolean;
};

export type PremiumCalmEnvironmentState = {
  available: boolean;
  active: boolean;
  title: string;
  body: string;
  density: CalmDensitySettings;
  motion: ReducedMotionSettings;
  sensory: SensoryComfortSettings;
};

export function deriveCalmDensityMode(input: CalmEnvironmentInput): CalmDensitySettings {
  const density = deriveEnvironmentAdaptiveDensity(input);
  return {
    mode: density.mode,
    spacingMultiplier: density.spacingMultiplier,
    maxVisibleSections: density.maxVisibleSections,
    prefersShorterReading: density.prefersShorterReading,
    label: density.label,
  };
}

export function deriveReducedMotionSettings(input: CalmEnvironmentInput): ReducedMotionSettings {
  const motion = deriveEnvironmentReducedMotionLevel(input);
  return {
    reducedMotion: motion.reducedMotion,
    motionScale: motion.motionScale,
    feedbackDelayMs: motion.feedbackDelayMs,
    reduceAnimationIntensity: motion.reduceAnimationIntensity,
    softenHaptics: motion.softenHaptics,
  };
}

export function deriveSensoryComfortSettings(input: CalmEnvironmentInput): SensoryComfortSettings {
  const sensory = deriveEnvironmentSensoryComfortMode(input);
  return {
    quieterPalette: sensory.quieterPalette,
    lowerVisualNoise: sensory.lowerVisualNoise,
    calmerContrast: sensory.calmerContrast,
    spaciousReading: sensory.spaciousReading,
    softerLoadingStates: sensory.softerLoadingStates,
    nightCalm: sensory.nightCalm,
  };
}

export function derivePremiumCalmEnvironment(input: CalmEnvironmentInput): PremiumCalmEnvironmentState {
  const environment = deriveCalmEnvironment(input);
  const density = deriveCalmDensityMode(input);
  const motion = deriveReducedMotionSettings(input);
  const sensory = deriveSensoryComfortSettings(input);

  return {
    available: environment.available,
    active: environment.active,
    title: environment.title,
    body: environment.body,
    density,
    motion,
    sensory,
  };
}
