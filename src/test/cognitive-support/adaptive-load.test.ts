import { describe, expect, it } from "vitest";
import { deriveAttentionLoad } from "../../../lib/cognitive-support/adaptive-load/deriveAttentionLoad";
import { deriveCognitiveIntensity } from "../../../lib/cognitive-support/adaptive-load/deriveCognitiveIntensity";

describe("cognitive support adaptive load", () => {
  it("raises attention load under fatigue, stress, and low sleep", () => {
    const load = deriveAttentionLoad({
      fatigue: 4,
      stress: 4,
      sleepHours: 5,
      mood: 2,
    });

    expect(load).toBe("high");
  });

  it("keeps intensity very light during overwhelmed high-load states", () => {
    const intensity = deriveCognitiveIntensity({
      adaptiveStatePrimary: "OVERWHELMED",
      attentionLoad: "high",
    });

    expect(intensity).toBe("very-light");
  });
});
