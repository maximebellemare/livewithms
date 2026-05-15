import { describe, expect, it } from "vitest";
import { derivePostExerciseReflection } from "../../../lib/cognitive-support/gentle-reflections/derivePostExerciseReflection";
import { deriveNormalizationSupport } from "../../../lib/cognitive-support/gentle-reflections/deriveNormalizationSupport";

describe("cognitive support gentle reflections", () => {
  it("keeps post exercise reflection non evaluative", () => {
    const result = derivePostExerciseReflection({
      attentionLoad: "high",
      completed: false,
    });

    expect(result.toLowerCase()).not.toMatch(/score|improve|perform/);
    expect(result.toLowerCase()).toContain("do not need");
  });

  it("normalizes fluctuating attention", () => {
    const result = deriveNormalizationSupport({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "moderate",
    });

    expect(result.toLowerCase()).toContain("naturally");
    expect(result.toLowerCase()).not.toContain("failure");
  });
});
