import { describe, expect, it } from "vitest";
import {
  deriveAdaptiveTone,
  derivePremiumAdaptiveSupport,
  deriveSupportDensity,
} from "../../../features/premium/adaptive-support";

describe("premium adaptive support", () => {
  it("activates subtle simplification during heavier stretches", () => {
    const result = derivePremiumAdaptiveSupport({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4,
      recentSleepAverage: 5.8,
      fatigueTrend: "high",
      stressTrend: "elevated",
      interactionTolerance: "reduced",
      preferredSupportStyle: "calm",
      preferredDensity: "minimal",
      timeOfDay: "morning",
      engagementRhythm: "sporadic",
    });

    expect(result.available).toBe(true);
    expect(result.active).toBe(true);
    expect(result.density.level).toBe("minimal");
    expect(result.simplification.shortenAiReplies).toBe(true);
    expect(result.lowEnergy.body.toLowerCase()).toContain("quieter");
  });

  it("keeps language restrained and non-invasive", () => {
    const tone = deriveAdaptiveTone({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 2.8,
      recentStressAverage: 2.7,
      recentSleepAverage: 7,
      interactionTolerance: "steady",
      preferredSupportStyle: "reflective",
      preferredDensity: "standard",
      timeOfDay: "evening",
    });

    const combined = `${tone.greeting} ${tone.supportLine} ${tone.coachLead} ${tone.reminderLine}`.toLowerCase();

    expect(combined).not.toMatch(/we noticed|know you deeply|personal companion|always here for you|condition/);
  });

  it("stays available but inactive when no heavier signals are present", () => {
    const result = derivePremiumAdaptiveSupport({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 2.4,
      recentStressAverage: 2.2,
      recentSleepAverage: 7.4,
      fatigueTrend: "lighter",
      stressTrend: "lighter",
      interactionTolerance: "steady",
      preferredSupportStyle: "practical",
      preferredDensity: "reflective",
      timeOfDay: "afternoon",
      engagementRhythm: "steady",
    });

    expect(result.available).toBe(true);
    expect(result.active).toBe(false);
    expect(result.density.level).toBe("standard");
  });

  it("lightens density for sporadic usage without overreacting", () => {
    const density = deriveSupportDensity({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 6.8,
      interactionTolerance: "steady",
      preferredSupportStyle: "steady",
      preferredDensity: "standard",
      engagementRhythm: "sporadic",
    });

    expect(density.level).toBe("lighter");
    expect(density.maxSuggestions).toBe(2);
  });
});
