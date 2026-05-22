import type { AdaptiveExperienceState } from "../adaptive-intelligence";
import type { ProgramLibraryCategory, ProgramTool } from "../../features/programs/types";

export type ProgramsEcosystemFatigueTrend = "high" | "moderate" | "steady" | "lighter" | "unknown";
export type ProgramsEcosystemStressTrend = "elevated" | "steady" | "lighter" | "unknown";
export type ProgramsEcosystemTimeOfDay = "morning" | "afternoon" | "evening";

export type ProgramsEcosystemInput = {
  hasPremiumAccess?: boolean;
  featureEnabled?: boolean;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  fatigueTrend: ProgramsEcosystemFatigueTrend;
  stressTrend: ProgramsEcosystemStressTrend;
  recentSleepAverage: number | null;
  brainFog?: number | null;
  suggestedToolId?: string | null;
  recentToolIds?: string[];
  lastOpenedToolId?: string | null;
  timeOfDay: ProgramsEcosystemTimeOfDay;
};

export type ProgramGroundingPriority =
  | "grounding-first"
  | "low-energy-first"
  | "sleep-first"
  | "brain-fog-first"
  | "steadiness-first";

export type ReducedStimulationMode = {
  active: boolean;
  preferAudio: boolean;
  simplerInteractions: boolean;
  reason: "overwhelm" | "fatigue" | "sleep" | "steady";
};

export type AdaptiveProgramDensityState = {
  level: "standard" | "lighter" | "minimal";
  maxVisiblePrograms: number;
  maxVisibleCategories: number;
  reduceRecommendationOverload: boolean;
};

export type CalmProgramFlow = {
  simplifyFurther: boolean;
  interruptionSafe: boolean;
  avoidCompletionPressure: boolean;
  supportsGentleResume: boolean;
  lowerEmotionalDensity: boolean;
};

export type ProgramsEcosystemState = {
  adaptive: AdaptiveExperienceState;
  groundingPriority: ProgramGroundingPriority;
  reducedStimulation: ReducedStimulationMode;
  density: AdaptiveProgramDensityState;
  calmProgramFlow: CalmProgramFlow;
  supportToolIds: ProgramTool["id"][];
  lowEnergyToolIds: ProgramTool["id"][];
  guidanceToolIds: ProgramTool["id"][];
  recommendedToolIds: ProgramTool["id"][];
  recommendedAudioToolIds: ProgramTool["id"][];
  categoryLabels: ProgramLibraryCategory[];
  recommendationLines: string[];
};
