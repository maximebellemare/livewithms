import { describe, expect, it } from "vitest";
import { deriveDignityPreservingExports } from "../../../lib/professional-support/human-centered-exports/deriveDignityPreservingExports";
import { preventReductionistScoring } from "../../../lib/professional-support/human-centered-exports/preventReductionistScoring";

describe("professional support human-centered exports", () => {
  it("preserves dignity in exported language", () => {
    const result = deriveDignityPreservingExports(["Patient compliance has been hard lately."]);

    expect(result[0].toLowerCase()).not.toContain("patient");
    expect(result[0].toLowerCase()).not.toContain("compliance");
  });

  it("prevents reductionist scoring language", () => {
    const result = preventReductionistScoring("Risk score and progression analysis included.");

    expect(result.toLowerCase()).not.toContain("risk score");
    expect(result.toLowerCase()).not.toContain("progression analysis");
  });
});
