import { describe, expect, it } from "vitest";
import { detectInvariantViolation } from "../../../lib/product-constitution/constitutional-drift/detectInvariantViolation";
import { detectPhilosophyCorruption } from "../../../lib/product-constitution/constitutional-drift/detectPhilosophyCorruption";

describe("product constitution constitutional drift", () => {
  it("detects invariant violations", () => {
    const result = detectInvariantViolation({
      invariantViolations: ["autonomy-preservation"],
      featureViolations: ["engagement-pressure"],
    });

    expect(result.violated).toBe(true);
    expect(result.violations).toContain("autonomy-preservation");
    expect(result.violations).toContain("engagement-pressure");
  });

  it("detects philosophy corruption under manipulation or autonomy compromise", () => {
    const result = detectPhilosophyCorruption({
      trendDrivenDrift: false,
      autonomyCompromised: true,
      manipulationRisk: false,
    });

    expect(result.corrupted).toBe(true);
    expect(result.severity).toBe("elevated");
  });
});
