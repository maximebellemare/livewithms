import { describe, expect, it } from "vitest";
import { deriveEnergyRhythms } from "../../../lib/personalization-intelligence/life-rhythms/deriveEnergyRhythms";
import { deriveInteractionTiming } from "../../../lib/personalization-intelligence/life-rhythms/deriveInteractionTiming";

describe("personalization intelligence life rhythms", () => {
  it("recognizes lower-energy rhythms without determinism", () => {
    const result = deriveEnergyRhythms({
      adaptiveStatePrimary: "LOW_ENERGY",
      recurringFatiguePattern: "high",
      recurringSleepPattern: "low",
    });

    expect(result.lowerEnergy).toBe(true);
    expect(result.summary.toLowerCase()).toContain("gentler");
  });

  it("derives timing as a fit rather than a rule", () => {
    const result = deriveInteractionTiming({
      preferredCheckinWindows: ["morning"],
      reminderWindow: "evening",
    });

    expect(result.preferredWindow).toBe("morning");
    expect(result.summary.toLowerCase()).not.toContain("must");
  });
});
