import { describe, expect, it } from "vitest";
import { validateInnovationNecessity } from "../../../lib/perpetual-refinement/restrained-innovation/validateInnovationNecessity";
import { preventNoveltyInflation } from "../../../lib/perpetual-refinement/restrained-innovation/preventNoveltyInflation";

describe("perpetual refinement restrained innovation", () => {
  it("requires real human value for innovation", () => {
    expect(
      validateInnovationNecessity({
        solvesAccessibilityNeed: false,
        reducesComplexity: false,
        drivenByTrendPressure: true,
      }).valid,
    ).toBe(false);
  });

  it("prevents novelty inflation language", () => {
    expect(preventNoveltyInflation("This is next-generation and groundbreaking.").toLowerCase()).not.toMatch(
      /next-generation|groundbreaking/,
    );
  });
});
