import { describe, expect, it } from "vitest";
import { deriveCalmLifeSupport } from "../../../lib/calm-life-support";

describe("unified calm life support", () => {
  it("prioritizes grounding and lower complexity during overwhelm", () => {
    const result = deriveCalmLifeSupport({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 3.8,
      recentStressAverage: 4.2,
      recentSleepAverage: 6,
      stressTrend: "elevated",
      interactionTolerance: "reduced",
      overwhelmDetected: true,
      message: "Everything feels too much and I need less pressure.",
      timeOfDay: "afternoon",
    });

    expect(result.priority).toBe("grounding");
    expect(result.governance.adaptive.maxRecommendationDensity).toBe(2);
    expect(result.lowPressureGuidance.length).toBeLessThanOrEqual(2);
    expect(result.reducedComplexity.reduceSuggestionCount).toBe(true);
    expect(result.adaptivePacing.slowerPacing).toBe(true);
    expect(result.calmDailySupport.body.toLowerCase()).toContain("solve everything right now");
  });

  it("keeps ordinary-life anchors and steadiness visible during low-energy periods", () => {
    const result = deriveCalmLifeSupport({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 3.5,
      recentSleepAverage: 5.8,
      fatigueTrend: "high",
      interactionTolerance: "reduced",
      message: "Ordinary life feels far away and I need a gentler routine.",
      timeOfDay: "morning",
    });

    expect(result.priority).toBe("low-energy");
    expect(result.ordinaryLifeAnchors.length).toBeGreaterThan(0);
    expect(result.recoverySteadiness.join(" ").toLowerCase()).toContain("slower pace");
  });

  it("keeps language free of therapy, productivity, and dependency framing", () => {
    const result = deriveCalmLifeSupport({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 3,
      recentStressAverage: 3,
      recentSleepAverage: 7,
      message: "I am rebuilding and want calmer support.",
      timeOfDay: "evening",
    });

    expect(
      `${result.lowPressureGuidance.join(" ")} ${result.calmDailySupport.title} ${result.calmDailySupport.body}`.toLowerCase(),
    ).not.toMatch(/productivity|therapy|self-help|always here for you|ai companion|journey|life coaching/);
  });
});
