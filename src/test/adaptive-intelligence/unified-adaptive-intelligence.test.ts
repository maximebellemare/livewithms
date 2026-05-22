import { describe, expect, it } from "vitest";
import {
  deriveAdaptiveCoachSettings,
  deriveAdaptiveExperience,
  deriveAdaptiveInsightsSettings,
  deriveAdaptiveNavigationSettings,
  deriveAdaptiveNotificationSettings,
  deriveAdaptiveProgramSettings,
  deriveCalmnessPresentation,
  deriveCognitiveLoadLevel,
  deriveInteractionTolerance,
  deriveLowEnergyState,
  deriveReducedComplexity,
  deriveSupportDensity,
} from "../../../lib/adaptive-intelligence";

describe("adaptive intelligence", () => {
  it("unifies heavier-day orchestration across calmness, density, and cognitive load", () => {
    const state = deriveAdaptiveExperience({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4.1,
      recentSleepAverage: 5.8,
      brainFog: 4,
      fatigueTrend: "high",
      stressTrend: "elevated",
      abandonedFlowCount: 2,
      engagementRhythm: "sporadic",
      preferredSupportStyle: "calm",
      preferredDensity: "minimal",
      message: "Everything feels too much and I cannot think clearly.",
      timeOfDay: "evening",
    });

    expect(state.available).toBe(true);
    expect(state.active).toBe(true);
    expect(state.interactionTolerance).toBe("reduced");
    expect(state.governance.adaptive.maxRecommendationDensity).toBeLessThanOrEqual(2);
    expect(state.recommendations.length).toBeLessThanOrEqual(state.governance.adaptive.maxRecommendationDensity);
    expect(state.density.level).toBe("minimal");
    expect(state.cognitiveLoad.level).toBe("active");
    expect(state.calmness.level).toBe("protective");
    expect(state.notifications.lowerNotificationPressure).toBe(true);
    expect(state.navigation.prioritizeLowEnergyAccess).toBe(true);
  });

  it("keeps adaptation subtle when signals are mild", () => {
    const density = deriveSupportDensity({
      recentFatigueAverage: 2.7,
      recentStressAverage: 2.8,
      recentSleepAverage: 7.2,
      fatigueTrend: "steady",
      stressTrend: "steady",
      engagementRhythm: "steady",
    });
    const load = deriveCognitiveLoadLevel({
      recentFatigueAverage: 2.7,
      recentStressAverage: 2.8,
      recentSleepAverage: 7.2,
      fatigueTrend: "steady",
      stressTrend: "steady",
    });
    const calmness = deriveCalmnessPresentation({
      recentFatigueAverage: 2.7,
      recentStressAverage: 2.8,
      recentSleepAverage: 7.2,
      fatigueTrend: "steady",
      stressTrend: "steady",
    });
    const lowEnergy = deriveLowEnergyState({
      recentFatigueAverage: 2.7,
      recentStressAverage: 2.8,
      recentSleepAverage: 7.2,
      fatigueTrend: "steady",
      stressTrend: "steady",
    });

    expect(density.level).toBe("standard");
    expect(load.level).toBe("none");
    expect(calmness.level).toBe("standard");
    expect(lowEnergy.active).toBe(false);
  });

  it("derives calmer coach, insights, programs, notifications, and navigation settings from one context", () => {
    const input = {
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 4.1,
      recentStressAverage: 4,
      recentSleepAverage: 5.9,
      brainFog: 4,
      fatigueTrend: "high" as const,
      stressTrend: "elevated" as const,
      abandonedFlowCount: 2,
      message: "I keep spiraling about the future and everything feels urgent.",
      timeOfDay: "evening" as const,
      engagementRhythm: "sporadic" as const,
      preferredSupportStyle: "calm" as const,
    };

    const coach = deriveAdaptiveCoachSettings(input);
    const insights = deriveAdaptiveInsightsSettings(input);
    const programs = deriveAdaptiveProgramSettings(input);
    const notifications = deriveAdaptiveNotificationSettings(input);
    const navigation = deriveAdaptiveNavigationSettings(input);
    const reduced = deriveReducedComplexity(input);

    expect(coach.maxChars).toBeLessThanOrEqual(220);
    expect(insights.reduceChartDensity).toBe(true);
    expect(programs.simplifyFurther).toBe(true);
    expect(notifications.quieterTiming).toBe(true);
    expect(navigation.reduceSimultaneousActions).toBe(true);
    expect(reduced.simplifyNavigation).toBe(true);
  });

  it("keeps interaction-tolerance and navigation adaptation non-invasive", () => {
    expect(deriveInteractionTolerance({ abandonedFlowCount: 2 })).toBe("reduced");
    expect(deriveInteractionTolerance({ abandonedFlowCount: 0 })).toBe("steady");

    const navigation = deriveAdaptiveNavigationSettings({
      recentFatigueAverage: 3.9,
      recentStressAverage: 3.9,
      stressTrend: "elevated",
      engagementRhythm: "sporadic",
    });

    expect(navigation.simplifyNavigation).toBe(true);
    expect(navigation.prioritizeLowEnergyAccess).toBe(false);
  });
});
