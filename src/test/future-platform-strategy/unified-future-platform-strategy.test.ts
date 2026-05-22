import { describe, expect, it } from "vitest";
import {
  deriveAllowedGrowthPatterns,
  deriveFuturePlatformStrategy,
  deriveSafeRetentionMechanics,
  validateFutureExpansion,
} from "../../../lib/future-platform-strategy";

describe("unified future platform strategy", () => {
  it("keeps future growth rooted in trust and calmness instead of manipulative retention", () => {
    const growth = deriveAllowedGrowthPatterns();
    const retention = deriveSafeRetentionMechanics();

    expect(growth.some((pattern) => pattern.key === "trust-led-retention" && pattern.allowed)).toBe(true);
    expect(growth.some((pattern) => pattern.key === "addictive-engagement-mechanics" && !pattern.allowed)).toBe(true);
    expect(retention.allowedDrivers).toContain("trust");
    expect(retention.blockedDrivers).toContain("emotional dependency");
  });

  it("builds a future strategy state that preserves calmness, accessibility, and bounded expansion", () => {
    const result = deriveFuturePlatformStrategy({
      hasPremiumAccess: true,
      featureEnabled: true,
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4.1,
      recentStressAverage: 4,
      recentSleepAverage: 5.7,
      overwhelmDetected: true,
      interactionTolerance: "reduced",
      message: "We want calmer Android and web expansion with lower pressure and better accessibility.",
      surface: "platform",
      expansionSurface: "android",
    });

    expect(result.platformCore.qualityAudit.ready).toBe(true);
    expect(result.calmness.preserveLowStimulation).toBe(true);
    expect(result.community.length).toBeGreaterThan(0);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.aiAndPlatformBoundaries.some((rule) => rule.key === "future-ai")).toBe(true);
    expect(result.audit.valid).toBe(true);
  });

  it("rejects future expansion that sounds manipulative, dependency-oriented, or pressure-heavy", () => {
    const result = validateFutureExpansion({
      message: "Limited time best value. Upgrade now. Your AI companion will stay with you forever and you need this.",
      surface: "premium",
      expansionSurface: "monetization",
    });

    expect(result.valid).toBe(false);
    expect(result.monetizationSafe).toBe(false);
    expect(result.dependencyRiskBlocked).toBe(false);
    expect(result.reasons.join(" ").toLowerCase()).toMatch(/limited time|best value|upgrade now|ai companion|need-framing/);
  });
});
