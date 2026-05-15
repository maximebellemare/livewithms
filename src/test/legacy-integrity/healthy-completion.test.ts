import { describe, expect, it } from "vitest";
import { deriveHealthyDistance } from "../../../lib/legacy-integrity/healthy-completion/deriveHealthyDistance";
import { preventRetentionClinginess } from "../../../lib/legacy-integrity/healthy-completion/preventRetentionClinginess";

describe("legacy integrity healthy completion", () => {
  it("frames less tracking as healthy distance rather than failure", () => {
    const result = deriveHealthyDistance({ totalCheckIns: 12, wantsLessIllnessCentrality: true });
    expect(result.toLowerCase()).toContain("healthy shift");
  });

  it("removes retention-clingy copy", () => {
    expect(preventRetentionClinginess("We miss you. Don't lose your progress.").toLowerCase()).not.toMatch(/we miss you|don't lose your progress/);
  });
});
