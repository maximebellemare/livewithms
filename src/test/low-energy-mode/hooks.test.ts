import { describe, expect, it } from "vitest";
import { applyLowEnergyModeOverride } from "../../../features/low-energy-mode/utils";
import type { AdaptiveProfile } from "../../../features/adaptive/types";

const adaptiveProfile: AdaptiveProfile = {
  stressTrend: "steady",
  sleepTrend: "steady",
  fatigueTrend: "steady",
  brainFogTrend: "steady",
  engagementPattern: "steady",
  reflectionPattern: "quiet",
  reminderTone: "daily-checkin",
  homeMoment: "Small patterns are becoming clearer.",
  lowEnergyMode: false,
  simplificationTitle: "Keep things simple",
  simplificationBody: "A few basics may be enough today.",
  suggestedProgram: null,
  secondarySuggestedProgram: null,
};

describe("low energy mode override", () => {
  it("enables low energy mode when the setting is turned on", () => {
    expect(applyLowEnergyModeOverride(adaptiveProfile, true).lowEnergyMode).toBe(true);
  });

  it("leaves the profile unchanged when the setting is off", () => {
    expect(applyLowEnergyModeOverride(adaptiveProfile, false)).toEqual(adaptiveProfile);
  });
});
