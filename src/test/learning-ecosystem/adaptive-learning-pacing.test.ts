import { describe, expect, it } from "vitest";
import { deriveLearningIntensity } from "../../../lib/learning-ecosystem/adaptive-learning-pacing/deriveLearningIntensity";
import { deriveEducationalLoad } from "../../../lib/learning-ecosystem/adaptive-learning-pacing/deriveEducationalLoad";

describe("learning ecosystem adaptive learning pacing", () => {
  it("raises educational load during heavier cognitive states", () => {
    const load = deriveEducationalLoad({
      fatigue: 4,
      stress: 4,
      sleepHours: 5,
      brainFog: 4,
    });

    expect(load).toBe("high");
  });

  it("uses very light learning intensity for overwhelmed high-load states", () => {
    const intensity = deriveLearningIntensity({
      adaptiveStatePrimary: "OVERWHELMED",
      educationalLoad: "high",
    });

    expect(intensity).toBe("very-light");
  });
});
