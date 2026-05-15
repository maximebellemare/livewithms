import { describe, expect, it } from "vitest";
import { deriveEnoughnessBoundaries } from "../../../lib/platform-finalization/completion-integrity/deriveEnoughnessBoundaries";
import { preventFeatureInflation } from "../../../lib/platform-finalization/completion-integrity/preventFeatureInflation";

describe("platform finalization completion integrity", () => {
  it("defines enoughness boundaries", () => {
    const result = deriveEnoughnessBoundaries().join(" ").toLowerCase();

    expect(result).toContain("do not add");
    expect(result).toContain("quiet");
  });

  it("prevents feature inflation language", () => {
    const result = preventFeatureInflation("Add more features through endless expansion.");

    expect(result.toLowerCase()).not.toContain("more features");
    expect(result.toLowerCase()).not.toContain("endless expansion");
  });
});
