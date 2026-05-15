import { describe, expect, it } from "vitest";
import { detectOverinterpretationRisk } from "../../../lib/self-trust/dependency-resistance/detectOverinterpretationRisk";
import { reduceAIOverpresence } from "../../../lib/self-trust/dependency-resistance/reduceAIOverpresence";

describe("self-trust dependency resistance", () => {
  it("raises risk when insight density and tracking intensity are high", () => {
    expect(
      detectOverinterpretationRisk({
        adaptiveStatePrimary: "OVERWHELMED",
        aiSurfaceVisible: true,
        stackedInsightCount: 4,
        trackingIntensity: "reduced",
      }),
    ).toBe("elevated");
  });

  it("reduces visible AI suggestions when risk is elevated", () => {
    const plan = reduceAIOverpresence({
      overinterpretationRisk: "elevated",
      requestedSuggestionCount: 3,
    });

    expect(plan.maxSuggestionCount).toBe(1);
    expect(plan.showPerspectiveNote).toBe(true);
  });
});
