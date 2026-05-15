import { describe, expect, it } from "vitest";
import { deriveExpansionCompatibility } from "../../../lib/sustainability-architecture/evolution-governance/deriveExpansionCompatibility";
import { validateFeatureIntegration } from "../../../lib/sustainability-architecture/evolution-governance/validateFeatureIntegration";

describe("sustainability architecture evolution governance", () => {
  it("validates feature integration requirements", () => {
    const result = validateFeatureIntegration({
      featureName: "new-ai-surface",
      activeSystems: ["system-coherence", "ethical-governance"],
      requiresSystems: ["system-coherence", "ethical-governance"],
      hasPhilosophyValidation: true,
    });

    expect(result.valid).toBe(true);
  });

  it("flags incompatible expansion patterns", () => {
    const result = deriveExpansionCompatibility({
      featureName: "wearable-ai",
      adaptiveTouchpoints: 4,
      hasConsentBoundary: false,
      hasHumanSecondaryPosition: false,
    });

    expect(result.compatible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
