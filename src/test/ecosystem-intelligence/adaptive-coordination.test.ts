import { describe, expect, it } from "vitest";
import { reconcileSupportSystems } from "../../../lib/ecosystem-intelligence/adaptive-coordination/reconcileSupportSystems";
import { preventAdaptiveOverlap } from "../../../lib/ecosystem-intelligence/adaptive-coordination/preventAdaptiveOverlap";

describe("ecosystem intelligence adaptive coordination", () => {
  it("reconciles support systems more tightly in harder states", () => {
    const result = reconcileSupportSystems({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      requestedSystems: ["learning", "cognition", "audio", "ambient"],
    });

    expect(result.visibleSystems.length).toBe(2);
    expect(result.suppressedSystems.length).toBe(2);
  });

  it("removes overlapping support guidance", () => {
    const result = preventAdaptiveOverlap([
      "Shorter steps may help.",
      "A simpler pace may help.",
      "Audio can stay available.",
    ]);

    expect(result.length).toBe(2);
  });
});
