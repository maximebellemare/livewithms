import { describe, expect, it } from "vitest";
import {
  deriveFutureGovernancePolicies,
  derivePlatformCoreState,
  derivePlatformQualityAudits,
  deriveSafeExpansionRules,
  validatePlatformContent,
} from "../../../lib/platform-core";

describe("unified platform core", () => {
  it("composes governance, adaptive calmness, and future-expansion rules into one stable state", () => {
    const result = derivePlatformCoreState({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4,
      recentSleepAverage: 5.8,
      brainFog: 3.9,
      interactionTolerance: "reduced",
      overwhelmDetected: true,
      engagementRhythm: "light",
      timeOfDay: "evening",
      message: "Everything feels heavy and I need calmer support.",
      surface: "platform",
    });

    expect(result.governance.adaptive.subtle).toBe(true);
    expect(result.supportDensity.maxRecommendationDensity).toBeLessThanOrEqual(2);
    expect(result.calmness.lowerStimulation).toBe(true);
    expect(result.premium.lowPressureUpgradeRequired).toBe(true);
    expect(result.analytics.avoidEmotionalProfiling).toBe(true);
    expect(result.operationalResilience.degradeGracefully).toBe(true);
    expect(result.accessibility.largeTapTargetsPreferred).toBe(true);
    expect(result.qualityAudit.ready).toBe(true);
  });

  it("flags unsafe copy and category drift through shared content governance", () => {
    const result = validatePlatformContent({
      message: "Your AI companion can optimize everything if you keep going.",
      surface: "premium",
    });

    expect(result.safe).toBe(false);
    expect(result.categoryIdentityProtected).toBe(false);
    expect(result.sanitizedMessage.toLowerCase()).not.toMatch(/ai companion|optimi[sz]e/);
  });

  it("keeps future expansion rules and policies aligned with calm product freeze goals", () => {
    const rules = deriveSafeExpansionRules();
    const policies = deriveFutureGovernancePolicies();

    expect(rules.some((rule) => rule.key === "ai-boundaries")).toBe(true);
    expect(rules.some((rule) => rule.key === "content-scaling")).toBe(true);
    expect(policies.some((policy) => policy.blockedDirections.includes("ai-companion"))).toBe(true);
    expect(policies.some((policy) => policy.blockedDirections.includes("manipulative-retention"))).toBe(true);
  });

  it("marks the platform as not ready when copy becomes manipulative or companion-like", () => {
    const audit = derivePlatformQualityAudits({
      message: "Your AI companion will stay with you forever, and you need this.",
      surface: "coach",
    });

    expect(audit.ready).toBe(false);
    expect(audit.governanceSafe).toBe(false);
    expect(audit.categoryIdentityProtected).toBe(false);
    expect(audit.reasons.join(" ").toLowerCase()).toMatch(/unsafe|dependency|need-framing|ai companion/);
  });
});
