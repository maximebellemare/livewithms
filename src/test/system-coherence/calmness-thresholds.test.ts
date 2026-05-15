import { describe, expect, it } from "vitest";
import { deriveEmotionalDensityLimits } from "../../../lib/system-coherence/calmness-thresholds/deriveEmotionalDensityLimits";
import { derivePromptLoadLimits } from "../../../lib/system-coherence/calmness-thresholds/derivePromptLoadLimits";

describe("system coherence calmness thresholds", () => {
  it("tightens density for overwhelmed states", () => {
    const result = deriveEmotionalDensityLimits({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      hasAiSummary: true,
    });

    expect(result.maxReflectionCards).toBe(1);
  });

  it("limits prompt load under higher burden", () => {
    const result = derivePromptLoadLimits({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "moderate",
    });

    expect(result.maxAiSuggestions).toBeLessThanOrEqual(2);
    expect(result.maxInterpretiveSentences).toBeLessThanOrEqual(3);
  });
});
