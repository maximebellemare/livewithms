import { describe, expect, it } from "vitest";
import { deriveReadingDensity } from "../../../lib/learning-ecosystem/fatigue-friendly-reading/deriveReadingDensity";
import { deriveLowEnergyReadingMode } from "../../../lib/learning-ecosystem/fatigue-friendly-reading/deriveLowEnergyReadingMode";

describe("learning ecosystem fatigue friendly reading", () => {
  it("keeps reading sparse under high educational load", () => {
    const density = deriveReadingDensity("high");

    expect(density.mode).toBe("sparse");
    expect(density.maxParagraphs).toBeLessThanOrEqual(2);
  });

  it("enables low-energy reading simplification", () => {
    const mode = deriveLowEnergyReadingMode({
      adaptiveStatePrimary: "LOW_ENERGY",
      educationalLoad: "high",
    });

    expect(mode.simplified).toBe(true);
    expect(mode.reducedBranching).toBe(true);
  });
});
