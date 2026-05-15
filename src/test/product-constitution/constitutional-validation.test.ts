import { describe, expect, it } from "vitest";
import { validateFeatureAgainstConstitution } from "../../../lib/product-constitution/constitutional-validation/validateFeatureAgainstConstitution";
import { deriveCompatibilityAssessment } from "../../../lib/product-constitution/constitutional-validation/deriveCompatibilityAssessment";

describe("product constitution constitutional validation", () => {
  it("flags incompatible feature behavior", () => {
    const result = validateFeatureAgainstConstitution({
      featureName: "ai-companion-surface",
      hasAiSurface: true,
      hasEngagementPressure: true,
      hasFearAmplification: false,
      reducesAutonomy: false,
    });

    expect(result.valid).toBe(false);
    expect(result.violations).toContain("engagement-pressure");
    expect(result.violations).toContain("ai-centrality");
  });

  it("derives compatibility level from violations and drift", () => {
    const result = deriveCompatibilityAssessment({
      violationCount: 1,
      driftSignals: 1,
    });

    expect(result.compatible).toBe(false);
    expect(result.level).toBe("guarded");
  });
});
