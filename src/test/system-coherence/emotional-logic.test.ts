import { describe, expect, it } from "vitest";
import { deriveUnifiedEmotionalRules } from "../../../lib/system-coherence/emotional-logic/deriveUnifiedEmotionalRules";
import { validateEmotionalConsistency } from "../../../lib/system-coherence/emotional-logic/validateEmotionalConsistency";

describe("system coherence emotional logic", () => {
  it("derives calmer rules under high burden", () => {
    const result = deriveUnifiedEmotionalRules({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      hasAiVisible: true,
      hasStackedEmotionalSurfaces: true,
    });

    expect(result.emotionalDensityLimit).toBe(1);
    expect(result.preferQuietTransitions).toBe(true);
  });

  it("detects inconsistent emotional combinations", () => {
    const result = validateEmotionalConsistency({
      tone: "reflective",
      atmosphere: "LIGHT",
      hasStackedEmotionalSurfaces: true,
      burden: "high",
    });

    expect(result.consistent).toBe(false);
  });
});
