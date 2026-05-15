import { describe, expect, it } from "vitest";
import { preserveUnifiedMaturity } from "../../../lib/human-quality-calibration/emotional-harmonization/preserveUnifiedMaturity";
import { validateToneConsistency } from "../../../lib/human-quality-calibration/emotional-harmonization/validateToneConsistency";

describe("human quality calibration emotional harmonization", () => {
  it("preserves unified maturity", () => {
    expect(preserveUnifiedMaturity("This magic support will supercharge your day.").toLowerCase()).not.toMatch(
      /magic|supercharge/,
    );
  });

  it("rejects inconsistent tone", () => {
    expect(validateToneConsistency(["Hey friend, this is a game changer."]).valid).toBe(false);
  });
});
