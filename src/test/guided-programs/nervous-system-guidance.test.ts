import { describe, expect, it } from "vitest";
import { deriveGroundingSupport } from "../../../lib/guided-programs/nervous-system-guidance/deriveGroundingSupport";
import { preventMotivationalPressure } from "../../../lib/guided-programs/nervous-system-guidance/preventMotivationalPressure";

describe("guided programs nervous system guidance", () => {
  it("keeps grounding support calm under overwhelmed states", () => {
    const result = deriveGroundingSupport({
      adaptiveStatePrimary: "OVERWHELMED",
      intensity: "very-gentle",
    });

    expect(result.toLowerCase()).not.toMatch(/push|challenge|quit/);
  });

  it("removes motivational pressure wording", () => {
    const result = preventMotivationalPressure("Stay consistent and don't quit.");

    expect(result.toLowerCase()).not.toContain("stay consistent");
    expect(result.toLowerCase()).not.toContain("don't quit");
  });
});
