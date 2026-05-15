import { describe, expect, it } from "vitest";
import { deriveHardBoundaries } from "../../../lib/product-constitution/ethical-constraints/deriveHardBoundaries";
import { preventManipulativeEvolution } from "../../../lib/product-constitution/ethical-constraints/preventManipulativeEvolution";

describe("product constitution ethical constraints", () => {
  it("defines hard boundaries against manipulation", () => {
    const boundaries = deriveHardBoundaries();

    expect(boundaries.disallowEngagementExtraction).toBe(true);
    expect(boundaries.disallowDependencyOptimization).toBe(true);
  });

  it("softens manipulative product language", () => {
    const result = preventManipulativeEvolution("We miss you. Don't lose momentum. Our analysis confirms this.");

    expect(result.toLowerCase()).not.toContain("we miss you");
    expect(result.toLowerCase()).not.toContain("don't lose momentum");
    expect(result.toLowerCase()).not.toContain("our analysis confirms");
  });
});
