import { describe, expect, it } from "vitest";
import { deriveSoftProgression } from "../../../lib/guided-programs/gentle-progression/deriveSoftProgression";
import { preventCompletionPressure } from "../../../lib/guided-programs/gentle-progression/preventCompletionPressure";

describe("guided programs gentle progression", () => {
  it("frames progress softly", () => {
    const result = deriveSoftProgression({
      completedCount: 1,
      totalCount: 3,
      intensity: "very-gentle",
    });

    expect(result.toLowerCase()).toContain("enough");
    expect(result.toLowerCase()).not.toContain("challenge");
  });

  it("removes completion pressure language", () => {
    const result = preventCompletionPressure("3/4 completed. Finish the module.");

    expect(result.toLowerCase()).not.toContain("completed");
    expect(result.toLowerCase()).not.toContain("finish");
  });
});
