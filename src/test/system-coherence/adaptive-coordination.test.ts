import { describe, expect, it } from "vitest";
import { preventAdaptiveOverstacking } from "../../../lib/system-coherence/adaptive-coordination/preventAdaptiveOverstacking";
import { reconcileAdaptiveSystems } from "../../../lib/system-coherence/adaptive-coordination/reconcileAdaptiveSystems";

describe("system coherence adaptive coordination", () => {
  it("reconciles adaptive systems more tightly in harder states", () => {
    const result = reconcileAdaptiveSystems({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "high",
      hasAiSummary: true,
      reflectionCount: 3,
      quickLinkCount: 3,
    });

    expect(result.maxReflectionCards).toBe(1);
    expect(result.suppressSecondarySurfaces).toBe(true);
  });

  it("prevents overstacking when multiple surfaces are present", () => {
    expect(
      preventAdaptiveOverstacking({
        requestedCount: 3,
        maxAllowedCount: 2,
        hasAiSummary: true,
        hasReflectionCards: true,
      }),
    ).toBe(1);
  });
});
