import { describe, expect, it } from "vitest";
import { deriveSimplicityRefactors } from "../../../lib/platform-finalization/complexity-compression/deriveSimplicityRefactors";
import { reduceFeatureRedundancy } from "../../../lib/platform-finalization/complexity-compression/reduceFeatureRedundancy";

describe("platform finalization complexity compression", () => {
  it("detects feature redundancy", () => {
    const result = reduceFeatureRedundancy({
      overlappingSystems: 5,
      duplicatePrompts: 2,
    });

    expect(result.needsCompression).toBe(true);
  });

  it("returns simplicity refactors", () => {
    expect(deriveSimplicityRefactors().length).toBeGreaterThan(0);
  });
});
