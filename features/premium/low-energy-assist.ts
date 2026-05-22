import {
  deriveAdaptiveExperience,
  guardEmotionalSupportCopy,
} from "../../lib/adaptive-intelligence";
import { deriveCalmLifeSupport } from "../../lib/calm-life-support";

type LowEnergyAssistInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  lowEnergyModeEnabled: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  fatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  stressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  abandonedFlowCount?: number;
  interactionTolerance?: "reduced" | "steady";
  overwhelmDetected?: boolean;
};

export type AdaptiveSimplification = {
  shortenSummaries: boolean;
  collapseSecondarySections: boolean;
  reduceChartDensity: boolean;
  simplifyPrograms: boolean;
  reduceVisualNoise: boolean;
  preferShortAiReplies: boolean;
};

export type ReducedCognitiveLoad = {
  level: "none" | "gentle" | "active";
  maxSuggestions: number;
  maxInsightCards: number;
  maxVisiblePrompts: number;
  maxVisibleSteps: number;
  maxCorrelationCards: number;
  maxStarterSuggestions: number;
};

export type CalmPresentationMode = {
  title: string;
  body: string;
  largerTapTargets: boolean;
  reduceAnimationIntensity: boolean;
  calmerLoadingStates: boolean;
};

export type LowEnergyAssistState = {
  available: boolean;
  active: boolean;
  triggerReasons: string[];
  simplification: AdaptiveSimplification;
  cognitiveLoad: ReducedCognitiveLoad;
  presentation: CalmPresentationMode;
};

function hasHeavyFatigue(input: LowEnergyAssistInput) {
  return input.fatigueTrend === "high" || (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8);
}

function hasHeavyStress(input: LowEnergyAssistInput) {
  return input.overwhelmDetected || input.stressTrend === "elevated" || (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8);
}

function hasLowSleep(input: LowEnergyAssistInput) {
  return typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3;
}

export function deriveAdaptiveSimplification(input: LowEnergyAssistInput): AdaptiveSimplification {
  const support = deriveCalmLifeSupport(input);
  const active = support.adaptive.intensity.level !== "steady";

  return {
    shortenSummaries: support.reducedComplexity.shortenReading,
    collapseSecondarySections: support.reducedComplexity.collapseSecondarySections,
    reduceChartDensity: active,
    simplifyPrograms: active,
    reduceVisualNoise: active,
    preferShortAiReplies: support.reducedComplexity.shortenReading,
  };
}

export function deriveReducedCognitiveLoad(input: LowEnergyAssistInput): ReducedCognitiveLoad {
  return deriveAdaptiveExperience(input).cognitiveLoad;
}

export function deriveCalmPresentationMode(input: LowEnergyAssistInput): CalmPresentationMode {
  const support = deriveCalmLifeSupport(input);
  const calmness = support.adaptive.calmness;
  const active = support.adaptive.intensity.level !== "steady";

  if (active) {
    return {
      title: "Low Energy Assist is on",
      body: guardEmotionalSupportCopy(
        `Low Energy Assist gently simplifies the experience during heavier days. ${support.lowPressureGuidance[0] ?? ""}`.trim(),
      ),
      largerTapTargets: true,
      reduceAnimationIntensity: calmness.reduceAnimationIntensity,
      calmerLoadingStates: true,
    };
  }

  return {
    title: "Low Energy Assist is available",
    body: guardEmotionalSupportCopy("Low Energy Assist can gently simplify the experience during heavier days."),
    largerTapTargets: false,
    reduceAnimationIntensity: false,
    calmerLoadingStates: false,
  };
}

export function deriveLowEnergyAssist(input: LowEnergyAssistInput): LowEnergyAssistState {
  const support = deriveCalmLifeSupport(input);
  const experience = support.adaptive;

  const simplification = deriveAdaptiveSimplification(input);
  const cognitiveLoad = deriveReducedCognitiveLoad(input);
  const presentation = deriveCalmPresentationMode(input);

  return {
    available: experience.available,
    active: experience.active,
    triggerReasons: experience.reasons,
    simplification,
    cognitiveLoad,
    presentation,
  };
}
