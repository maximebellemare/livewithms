import { describe, expect, it } from "vitest";
import { deriveHealthySteppingAway } from "../../../lib/human-centered-ai/healthy-disengagement/deriveHealthySteppingAway";
import { normalizeNonTrackingPeriods } from "../../../lib/human-centered-ai/healthy-disengagement/normalizeNonTrackingPeriods";

describe("human centered ai healthy disengagement", () => {
  it("normalizes stepping away under higher relational risk", () => {
    const result = deriveHealthySteppingAway({
      adaptiveStatePrimary: "OVERWHELMED",
      relationalRisk: "elevated",
    });

    expect(result).toBeTruthy();
    expect(result?.toLowerCase()).toContain("do not need");
  });

  it("normalizes non tracking periods", () => {
    const result = normalizeNonTrackingPeriods({
      adaptiveStatePrimary: "LOW_ENERGY",
      hasTrackingPressure: true,
    });

    expect(result?.toLowerCase()).toContain("not tracking");
  });
});
