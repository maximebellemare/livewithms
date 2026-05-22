import { describe, expect, it } from "vitest";
import {
  deriveGoalsFromPriorities,
  deriveOnboardingSupportPreference,
  getPersonalizedOnboardingGuidance,
} from "../../../features/onboarding/personalization";

describe("onboarding personalization", () => {
  it("derives calmer goal seeds from selected priorities", () => {
    expect(
      deriveGoalsFromPriorities(["Fatigue", "Stress", "Care Organization", "Brain Fog"]),
    ).toEqual(["Energy Support", "Stress Support", "Care Organization"]);
  });

  it("maps low-energy onboarding support to calm minimal preferences", () => {
    expect(deriveOnboardingSupportPreference("low-energy")).toEqual({
      supportStyle: "calm",
      preferredDensity: "minimal",
      complexityTolerance: "lower",
      lowEnergyMode: true,
    });
  });

  it("keeps first-check-in guidance low pressure for low-energy starts", () => {
    const guidance = getPersonalizedOnboardingGuidance({
      display_name: "",
      ms_type: "",
      year_diagnosed: "",
      symptoms: ["Low-Energy Days"],
      goals: ["Energy Support"],
      country: "",
      age_range: "",
      support_style: "low-energy",
      low_energy_mode: true,
      reminder_preference: "skip",
    });

    expect(guidance.title).toContain("lighter");
    expect(guidance.body.toLowerCase()).toContain("small");
  });
});
