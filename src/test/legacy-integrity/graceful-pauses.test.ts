import { describe, expect, it } from "vitest";
import { derivePauseSupport } from "../../../lib/legacy-integrity/graceful-pauses/derivePauseSupport";
import { preserveCalmDisengagement } from "../../../lib/legacy-integrity/graceful-pauses/preserveCalmDisengagement";

describe("legacy integrity graceful pauses", () => {
  it("normalizes stepping back without guilt", () => {
    const result = derivePauseSupport({ lowEngagement: true, wantsDistance: true });
    expect(result.body.toLowerCase()).toContain("step back");
  });

  it("removes clingy disengagement language", () => {
    expect(preserveCalmDisengagement("Don't leave now, stay with it.").toLowerCase()).not.toMatch(/don't leave|stay with it/);
  });
});
