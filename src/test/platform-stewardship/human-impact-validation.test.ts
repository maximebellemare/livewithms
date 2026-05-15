import { describe, expect, it } from "vitest";
import { deriveHumanImpactChecks } from "../../../lib/platform-stewardship/human-impact-validation/deriveHumanImpactChecks";
import { validateAutonomyEffects } from "../../../lib/platform-stewardship/human-impact-validation/validateAutonomyEffects";

describe("platform stewardship human impact validation", () => {
  it("surfaces human impact questions", () => {
    const result = deriveHumanImpactChecks().join(" ").toLowerCase();

    expect(result).toContain("autonomy");
    expect(result).toContain("cognitive load");
  });

  it("rejects autonomy-reducing changes", () => {
    expect(
      validateAutonomyEffects({
        increasesDependencyRisk: true,
        increasesPromptPressure: false,
        reducesSafeDisengagement: true,
      }).valid,
    ).toBe(false);
  });
});
