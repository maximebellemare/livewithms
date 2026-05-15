import { describe, expect, it } from "vitest";
import { deriveSustainableCadence } from "../../../lib/behavior-support/sustainable-rhythm/deriveSustainableCadence";
import { detectOverextensionPatterns } from "../../../lib/behavior-support/sustainable-rhythm/detectOverextensionPatterns";

describe("behavior support rhythm", () => {
  it("optimizes for sustainability rather than intensity", () => {
    expect(
      deriveSustainableCadence({
        recentActiveDays: 1,
        weeklyCheckIns: 1,
      }),
    ).toBe("light-touch");

    expect(
      deriveSustainableCadence({
        recentActiveDays: 5,
        weeklyCheckIns: 4,
      }),
    ).toBe("steady");
  });

  it("detects overextension patterns when energy is low", () => {
    const pattern = detectOverextensionPatterns({
      adaptiveStatePrimary: "LOW_ENERGY",
      interactionFrequency: 3,
      weeklyCheckIns: 4,
    });

    expect(pattern.atRisk).toBe(true);
    expect(pattern.reason).toBe("intensity-during-low-energy");
  });
});
