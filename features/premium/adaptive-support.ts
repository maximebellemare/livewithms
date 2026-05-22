import type { PreferredDensity, SupportStyle } from "../../lib/personalization/types";
import {
  deriveAdaptiveExperience,
  guardEmotionalSupportCopy,
} from "../../lib/adaptive-intelligence";
import { deriveCalmLifeSupport } from "../../lib/calm-life-support";

type AdaptiveSupportInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  lowEnergyModeEnabled: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  fatigueTrend?: "high" | "steady" | "lighter" | "unknown";
  stressTrend?: "elevated" | "steady" | "lighter" | "unknown";
  interactionTolerance?: "reduced" | "steady";
  preferredSupportStyle?: SupportStyle | null;
  preferredDensity?: PreferredDensity | null;
  timeOfDay?: "morning" | "afternoon" | "evening";
  abandonedFlowCount?: number;
  engagementRhythm?: "light" | "steady" | "sporadic";
};

export type AdaptiveTone = {
  greeting: string;
  supportLine: string;
  coachLead: string;
  reminderLine: string;
};

export type SupportDensity = {
  level: "standard" | "lighter" | "minimal";
  maxCards: number;
  maxSuggestions: number;
  maxSecondarySections: number;
};

export type InteractionSimplification = {
  shortenAiReplies: boolean;
  reduceSuggestionCount: boolean;
  collapseLowerPrioritySections: boolean;
  simplifyNavigation: boolean;
  reduceRecommendationIntensity: boolean;
};

export type CalmnessAdjustments = {
  reduceVisualNoise: boolean;
  reduceAnimationIntensity: boolean;
  lowerEmotionalIntensity: boolean;
  quieterPresentation: boolean;
};

export type LowEnergyAdaptation = {
  active: boolean;
  title: string;
  body: string;
};

export type PremiumAdaptiveSupportState = {
  available: boolean;
  active: boolean;
  reasons: string[];
  tone: AdaptiveTone;
  density: SupportDensity;
  simplification: InteractionSimplification;
  calmness: CalmnessAdjustments;
  lowEnergy: LowEnergyAdaptation;
};

function hasHeavyFatigue(input: AdaptiveSupportInput) {
  return input.fatigueTrend === "high" || (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8);
}

function hasHeavyStress(input: AdaptiveSupportInput) {
  return input.stressTrend === "elevated" || (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8);
}

function hasLowSleep(input: AdaptiveSupportInput) {
  return typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3;
}

function isReducedTolerance(input: AdaptiveSupportInput) {
  return input.interactionTolerance === "reduced" || (input.abandonedFlowCount ?? 0) >= 2;
}

export function deriveAdaptiveTone(input: AdaptiveSupportInput): AdaptiveTone {
  const support = deriveCalmLifeSupport(input);
  const experience = support.adaptive;
  const heavierMoment = experience.intensity.level !== "steady";
  const greeting =
    input.timeOfDay === "morning"
      ? "Good morning"
      : input.timeOfDay === "evening"
        ? "Good evening"
        : "Hello";

  if (heavierMoment) {
    return {
      greeting,
      supportLine: guardEmotionalSupportCopy(support.lowPressureGuidance[0] ?? "Simpler support may feel easier today."),
      coachLead: guardEmotionalSupportCopy(support.calmDailySupport.body),
      reminderLine: guardEmotionalSupportCopy("You can keep things lighter today if needed."),
    };
  }

  if (input.preferredSupportStyle === "practical") {
    return {
      greeting,
      supportLine: guardEmotionalSupportCopy("A simpler next step may be enough."),
      coachLead: guardEmotionalSupportCopy("Keep this as practical and light as you want."),
      reminderLine: guardEmotionalSupportCopy("Reminders can stay gentle and adjustable."),
    };
  }

  if (input.preferredSupportStyle === "reflective") {
    return {
      greeting,
      supportLine: guardEmotionalSupportCopy("A quieter check-in may still be enough today."),
      coachLead: guardEmotionalSupportCopy("Keep reflection brief and grounded."),
      reminderLine: guardEmotionalSupportCopy("A small prompt can be enough."),
    };
  }

  return {
    greeting,
    supportLine: guardEmotionalSupportCopy("A calmer pace may help right now."),
    coachLead: guardEmotionalSupportCopy("Keep this simple if that feels better today."),
    reminderLine: guardEmotionalSupportCopy("Reminders are here quietly if they help."),
  };
}

export function deriveSupportDensity(input: AdaptiveSupportInput): SupportDensity {
  return deriveAdaptiveExperience(input).density;
}

export function deriveInteractionSimplification(input: AdaptiveSupportInput): InteractionSimplification {
  const support = deriveCalmLifeSupport(input);
  const lighter = support.adaptive.intensity.level !== "steady";

  return {
    shortenAiReplies: support.reducedComplexity.shortenReading || input.preferredDensity === "minimal",
    reduceSuggestionCount: support.reducedComplexity.reduceSuggestionCount,
    collapseLowerPrioritySections: support.reducedComplexity.collapseSecondarySections,
    simplifyNavigation: support.reducedComplexity.simplifyNavigation || input.engagementRhythm === "sporadic",
    reduceRecommendationIntensity: support.reducedComplexity.reduceRecommendationIntensity || input.preferredSupportStyle === "calm",
  };
}

export function deriveCalmnessAdjustments(input: AdaptiveSupportInput): CalmnessAdjustments {
  return deriveAdaptiveExperience(input).calmness;
}

export function deriveLowEnergyAdaptation(input: AdaptiveSupportInput): LowEnergyAdaptation {
  const support = deriveCalmLifeSupport(input);
  const active = support.adaptive.intensity.level !== "steady";

  if (active) {
    return {
      active: true,
      title: "Gentler adaptive support",
      body: guardEmotionalSupportCopy(
        `Premium can keep things quieter, shorter, and a little lighter during heavier stretches. ${support.lowPressureGuidance[0] ?? ""}`.trim(),
      ),
    };
  }

  return {
    active: false,
    title: "Adaptive support is available",
    body: guardEmotionalSupportCopy("Premium can gently simplify the app when a calmer pace would help."),
  };
}

export function derivePremiumAdaptiveSupport(input: AdaptiveSupportInput): PremiumAdaptiveSupportState {
  const support = deriveCalmLifeSupport(input);
  const experience = support.adaptive;

  const density = deriveSupportDensity(input);
  const simplification = deriveInteractionSimplification(input);
  const calmness = deriveCalmnessAdjustments(input);
  const lowEnergy = deriveLowEnergyAdaptation(input);

  return {
    available: experience.available,
    active: experience.active,
    reasons: experience.reasons,
    tone: deriveAdaptiveTone(input),
    density,
    simplification,
    calmness,
    lowEnergy,
  };
}
