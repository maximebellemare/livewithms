import { describe, expect, it } from "vitest";
import { deriveBrainFogAdaptation } from "../../../lib/cognitive-support/brain-fog-support/deriveBrainFogAdaptation";
import { generateConfidencePreservingLanguage } from "../../../lib/cognitive-support/brain-fog-support/generateConfidencePreservingLanguage";

describe("cognitive support brain fog support", () => {
  it("adapts flow for brain-fog-prone states", () => {
    const result = deriveBrainFogAdaptation({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "high",
    });

    expect(result.shorterSteps).toBe(true);
    expect(result.reducedBranching).toBe(true);
  });

  it("uses confidence-preserving non-shaming language", () => {
    const result = generateConfidencePreservingLanguage({
      adaptiveStatePrimary: "OVERWHELMED",
      attentionLoad: "high",
    });

    expect(result.toLowerCase()).not.toMatch(/decline|failure|inadequate/);
    expect(result.toLowerCase()).toContain("does not");
  });
});
