import { describe, expect, it } from "vitest";
import { deriveAccessibilityInsights } from "../../../lib/ethical-insights/population-patterns/deriveAccessibilityInsights";
import { deriveAnonymizedPatterns } from "../../../lib/ethical-insights/population-patterns/deriveAnonymizedPatterns";

describe("ethical insights population patterns", () => {
  it("keeps small cohorts hidden", () => {
    const result = deriveAnonymizedPatterns({
      topic: "fatigue",
      cohortSize: 8,
    });

    expect(result.toLowerCase()).toContain("hidden");
  });

  it("keeps accessibility insights broad and non-personal", () => {
    const result = deriveAccessibilityInsights().join(" ").toLowerCase();

    expect(result).toContain("aggregated");
    expect(result).not.toContain("specific person");
  });
});
