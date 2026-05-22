import { describe, expect, it } from "vitest";
import {
  applySafeAIBehavior,
  deriveAllowedAdaptationLevel,
  deriveCalmnessConstraints,
  deriveMaxRecommendationDensity,
  derivePlatformGovernance,
  validateEmotionalSafety,
} from "../../../lib/platform-governance";

describe("unified platform governance", () => {
  it("flags unsafe language and manipulative pressure centrally", () => {
    const result = validateEmotionalSafety({
      message: "I am always here for you. Don't stop now. Your AI companion can stay with you forever.",
      surface: "coach",
    });

    expect(result.valid).toBe(false);
    expect(result.containsUnsafeLanguage).toBe(true);
    expect(result.containsEngagementPressure).toBe(true);
    expect(result.containsBoundaryViolation).toBe(true);
  });

  it("keeps adaptive governance subtle while reducing density during heavier periods", () => {
    const adaptive = deriveAllowedAdaptationLevel({
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.1,
      recentStressAverage: 4.2,
      recentSleepAverage: 5.7,
      overwhelmDetected: true,
      interactionTolerance: "reduced",
      surface: "platform",
    });

    expect(adaptive.level).toBe("protective");
    expect(adaptive.subtle).toBe(true);
    expect(adaptive.maxRecommendationDensity).toBe(2);
    expect(deriveMaxRecommendationDensity({ lowEnergyModeEnabled: true, overwhelmDetected: true })).toBe(2);
  });

  it("preserves calmness and AI boundaries across platform governance", () => {
    const governance = derivePlatformGovernance({
      lowEnergyModeEnabled: false,
      recentFatigueAverage: 3.9,
      recentStressAverage: 4,
      brainFog: 4,
      interactionTolerance: "reduced",
      message: "Everything feels too much and I need less pressure.",
      surface: "today",
    });

    expect(governance.calmness.reduceUrgency).toBe(true);
    expect(governance.ai.avoidTherapySimulation).toBe(true);
    expect(governance.accessibility.fatigueReadable).toBe(true);
    expect(governance.operational.preferSilentRetries).toBe(true);
  });

  it("sanitizes companion-like AI language before it reaches users", () => {
    const result = applySafeAIBehavior("Your AI companion will stay with you. You have me.");

    expect(result.toLowerCase()).not.toMatch(/ai companion|stay with you|you have me/);
  });

  it("keeps calmness constraints bounded instead of theatrical", () => {
    const constraints = deriveCalmnessConstraints({
      lowEnergyModeEnabled: true,
      timeOfDay: "evening",
      recentFatigueAverage: 4.3,
    });

    expect(constraints.preserveSpaciousness).toBe(true);
    expect(constraints.lowerStimulation).toBe(true);
    expect(constraints.reduceTextWalls).toBe(true);
  });

  it("protects the platform from category drift toward companion or optimization culture", () => {
    const result = validateEmotionalSafety({
      message: "This AI companion can optimize your recovery if you keep going.",
      surface: "premium",
    });

    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ").toLowerCase()).toMatch(/unsafe|pressure|boundary|sanitized/);
  });
});
