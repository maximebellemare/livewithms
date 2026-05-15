import { describe, expect, it } from "vitest";
import { deriveRefinementPriorities } from "../../../lib/perpetual-refinement/refinement-framework/deriveRefinementPriorities";
import { preserveCalmEvolution } from "../../../lib/perpetual-refinement/refinement-framework/preserveCalmEvolution";

describe("perpetual refinement refinement framework", () => {
  it("prioritizes quiet long-term refinement", () => {
    expect(deriveRefinementPriorities().join(" ").toLowerCase()).toContain("accessibility");
  });

  it("preserves calm evolution language", () => {
    expect(preserveCalmEvolution("This requires disruptive innovation and constant reinvention.").toLowerCase()).not.toMatch(
      /disruptive innovation|constant reinvention/,
    );
  });
});
