import { describe, expect, it } from "vitest";
import { deriveMentalLightness } from "../../../lib/human-quality-calibration/cognitive-lightness/deriveMentalLightness";
import { reduceSubtleFriction } from "../../../lib/human-quality-calibration/cognitive-lightness/reduceSubtleFriction";

describe("human quality calibration cognitive lightness", () => {
  it("detects subtle friction", () => {
    expect(
      reduceSubtleFriction({
        visibleChoices: 6,
        requiredDecisions: 3,
        contextSwitches: 2,
      }).needsReduction,
    ).toBe(true);
  });

  it("derives mental lightness", () => {
    expect(
      deriveMentalLightness({
        burden: "low",
        visibleChoices: 3,
        hasSharpCopy: false,
      }).calm,
    ).toBe(true);
  });
});
