import { describe, expect, it } from "vitest";
import { detectOverInterpretation } from "../../../lib/resilience-under-scale/intelligence-inflation-resistance/detectOverInterpretation";
import { detectAdaptationInflation } from "../../../lib/resilience-under-scale/intelligence-inflation-resistance/detectAdaptationInflation";

describe("resilience under scale intelligence inflation resistance", () => {
  it("detects over-interpretation when insights and density get too high", () => {
    const result = detectOverInterpretation({
      interpretiveSentenceLimit: 4,
      aiSuggestionLimit: 2,
      reflectionCount: 2,
    });

    expect(result.inflated).toBe(true);
    expect(result.severity).toBe("elevated");
  });

  it("detects adaptation inflation when too many systems layer together", () => {
    const result = detectAdaptationInflation({
      activeSystemCount: 5,
      adaptationIntensity: "supportive",
      duplicationCount: 1,
    });

    expect(result.inflated).toBe(true);
  });
});
