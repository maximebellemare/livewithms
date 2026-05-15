import { describe, expect, it } from "vitest";
import { deriveAdaptiveAccessibility } from "../../../lib/personalization-intelligence/longitudinal-adaptation/deriveAdaptiveAccessibility";
import { deriveLongTermSupportFit } from "../../../lib/personalization-intelligence/longitudinal-adaptation/deriveLongTermSupportFit";

describe("personalization intelligence longitudinal adaptation", () => {
  it("keeps long-term fit lighter when capacity is lower", () => {
    const result = deriveLongTermSupportFit({
      preferredSupportStyle: "practical",
      engagementRhythm: "light",
      lowEnergy: true,
    });

    expect(result.toLowerCase()).toContain("lighter");
  });

  it("adapts accessibility quietly", () => {
    const result = deriveAdaptiveAccessibility({
      lowStim: true,
      lowEnergy: true,
    });

    expect(result.toLowerCase()).toContain("quietly");
  });
});
