import { describe, expect, it } from "vitest";
import { deriveNavigationPriority } from "../../../lib/cognitive-simplification/navigation-quieting/deriveNavigationPriority";
import { deriveHiddenComplexity } from "../../../lib/cognitive-simplification/navigation-quieting/deriveHiddenComplexity";

describe("cognitive simplification navigation quieting", () => {
  it("reduces visible navigation routes during high burden", () => {
    const priority = deriveNavigationPriority({
      burden: "high",
      disclosureDepth: "minimal",
    });

    expect(priority.maxVisibleRoutes).toBe(2);
  });

  it("hides secondary complexity when disclosure is minimal", () => {
    const hidden = deriveHiddenComplexity({
      burden: "high",
      disclosureDepth: "minimal",
    });

    expect(hidden.hideSecondarySupport).toBe(true);
    expect(hidden.hideBestWorstDay).toBe(true);
  });
});
