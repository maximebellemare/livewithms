import { describe, expect, it } from "vitest";
import { deriveCognitiveBurden } from "../../../lib/cognitive-simplification/cognitive-load/deriveCognitiveBurden";
import { deriveDecisionLoad } from "../../../lib/cognitive-simplification/cognitive-load/deriveDecisionLoad";

describe("cognitive simplification burden heuristics", () => {
  it("raises burden during low-energy or crowded surfaces", () => {
    expect(
      deriveCognitiveBurden({
        adaptiveStatePrimary: "LOW_ENERGY",
        visibleSurfaceCount: 6,
        actionCount: 4,
        hasAiSummary: true,
      }),
    ).toBe("high");
  });

  it("keeps decision load lower when choices are limited", () => {
    expect(
      deriveDecisionLoad({
        actionCount: 2,
        optionCount: 1,
        hasSecondaryChoices: false,
      }),
    ).toBe("low");
  });
});
