import { describe, expect, it } from "vitest";
import { deriveEmotionalCeilings } from "../../../lib/meta-orchestration/calmness-kernel/deriveEmotionalCeilings";
import { deriveInterpretationLimits } from "../../../lib/meta-orchestration/calmness-kernel/deriveInterpretationLimits";

describe("meta orchestration calmness kernel", () => {
  it("enforces tight emotional ceilings in high-load states", () => {
    const result = deriveEmotionalCeilings({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      adaptationIntensity: "minimal",
    });

    expect(result.maxVisibleEmotionalSurfaces).toBe(1);
  });

  it("reduces interpretation limits under minimal adaptation", () => {
    const result = deriveInterpretationLimits({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "moderate",
      adaptationIntensity: "minimal",
    });

    expect(result.maxAiSuggestions).toBe(1);
    expect(result.maxInterpretiveSentences).toBe(2);
  });
});
