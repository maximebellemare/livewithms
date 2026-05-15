import { describe, expect, it } from "vitest";
import { deriveUnifiedAdaptiveState } from "../../../lib/meta-orchestration/global-adaptation/deriveUnifiedAdaptiveState";
import { orchestrateAdaptiveSystems } from "../../../lib/meta-orchestration/global-adaptation/orchestrateAdaptiveSystems";

describe("meta orchestration global adaptation", () => {
  it("derives a calmer unified state under higher burden", () => {
    const result = deriveUnifiedAdaptiveState({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      reflectionCount: 2,
      hasAiVisible: true,
    });

    expect(result.preserveCalmness).toBe(true);
    expect(result.preferNeutralBridge).toBe(true);
  });

  it("orchestrates ceilings and interpretation limits together", () => {
    const result = orchestrateAdaptiveSystems({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "moderate",
      reflectionCount: 1,
      hasAiVisible: true,
      activeSystems: ["ai-trust", "system-coherence", "ethical-governance"],
    });

    expect(result.emotionalCeilings.maxReflectionCards).toBeLessThanOrEqual(2);
    expect(result.interpretationLimits.maxAiSuggestions).toBeLessThanOrEqual(2);
  });

  it("returns institutional memory and continuity guidance", () => {
    const result = orchestrateAdaptiveSystems({
      adaptiveStatePrimary: "STABLE",
      burden: "moderate",
      reflectionCount: 1,
      hasAiVisible: true,
      activeSystems: ["ai-trust", "system-coherence", "ethical-governance", "attention-respect"],
    });

    expect(result.intentAnnotations.length).toBeGreaterThan(0);
    expect(result.philosophyDecisions.length).toBeGreaterThan(0);
    expect(result.organizationalMemory.searchableTopics.length).toBeGreaterThan(0);
  });

  it("returns constitutional governance signals", () => {
    const result = orchestrateAdaptiveSystems({
      adaptiveStatePrimary: "STABLE",
      burden: "moderate",
      reflectionCount: 1,
      hasAiVisible: true,
      activeSystems: [
        "ai-trust",
        "system-coherence",
        "ethical-governance",
        "human-centered-ai",
        "product-constitution",
      ],
    });

    expect(result.immutablePrinciples.length).toBeGreaterThan(0);
    expect(typeof result.constitutionalValidation.valid).toBe("boolean");
    expect(result.userRightsFramework.length).toBeGreaterThan(0);
  });
});
