import { describe, expect, it } from "vitest";
import { deriveRefinementPriorities } from "../../../lib/platform-finalization/calm-refinement/deriveRefinementPriorities";
import { preserveEmotionalSmoothness } from "../../../lib/platform-finalization/calm-refinement/preserveEmotionalSmoothness";

describe("platform finalization calm refinement", () => {
  it("prioritizes refinement over spectacle", () => {
    const result = deriveRefinementPriorities().join(" ").toLowerCase();

    expect(result).toContain("accessibility");
    expect(result).not.toContain("spectacle");
  });

  it("softens novelty-heavy language", () => {
    const result = preserveEmotionalSmoothness("This exciting new dramatic improvement is a bold reinvention.");

    expect(result.toLowerCase()).not.toContain("exciting new");
    expect(result.toLowerCase()).not.toContain("bold reinvention");
  });
});
