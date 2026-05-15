import { describe, expect, it } from "vitest";
import { deriveEmotionallySafeErrors } from "../../../lib/operational-excellence/calm-error-states/deriveEmotionallySafeErrors";
import { preventTechnicalOverwhelm } from "../../../lib/operational-excellence/calm-error-states/preventTechnicalOverwhelm";

describe("operational excellence calm error states", () => {
  it("derives emotionally safe error copy", () => {
    const result = deriveEmotionallySafeErrors({
      category: "sync",
      retryable: true,
    });

    expect(result.title.toLowerCase()).toContain("moment");
    expect(result.retryLabel.toLowerCase()).toContain("gently");
  });

  it("removes technical overload terms", () => {
    const result = preventTechnicalOverwhelm("A transport error caused an exception and stack trace.");

    expect(result.toLowerCase()).not.toContain("transport error");
    expect(result.toLowerCase()).not.toContain("stack trace");
  });
});
