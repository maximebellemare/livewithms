import { describe, expect, it } from "vitest";
import { deriveEmotionalPacing } from "../../../lib/personalization-intelligence/emotional-fit/deriveEmotionalPacing";
import { deriveOverwhelmReduction } from "../../../lib/personalization-intelligence/emotional-fit/deriveOverwhelmReduction";

describe("personalization intelligence emotional fit", () => {
  it("lightens emotional pace during quieter re-entry", () => {
    const result = deriveEmotionalPacing({
      adaptiveStatePrimary: "LOW_ENERGY",
      engagementRhythm: "light",
      recoveryRhythm: "quiet-reentry",
    });

    expect(result.fit).toBe("lighter");
  });

  it("reduces overwhelm without psychological ownership", () => {
    const result = deriveOverwhelmReduction({
      lowEnergy: true,
      lowStim: true,
      fit: "lighter",
    });

    expect(result.toLowerCase()).toContain("reducing");
    expect(result.toLowerCase()).not.toContain("control");
  });
});
