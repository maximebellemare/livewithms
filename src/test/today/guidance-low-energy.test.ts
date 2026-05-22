import { describe, expect, it } from "vitest";
import { buildTodayGuidance } from "../../../features/today/guidance";
import type { AdaptiveProfile } from "../../../features/adaptive/types";

const adaptiveProfile: AdaptiveProfile = {
  stressTrend: "steady",
  sleepTrend: "steady",
  fatigueTrend: "steady",
  brainFogTrend: "steady",
  engagementPattern: "steady",
  reflectionPattern: "quiet",
  reminderTone: "daily-checkin",
  homeMoment: "Small patterns are becoming clearer over time.",
  lowEnergyMode: false,
  simplificationTitle: "Keep things lighter",
  simplificationBody: "A shorter list may help today feel steadier.",
  suggestedProgram: "one-priority-planner",
  secondarySuggestedProgram: null,
};

describe("today guidance low energy refinement", () => {
  it("reduces actions when low energy mode is forced on", () => {
    const guidance = buildTodayGuidance(
      null,
      {
        summary:
          "A short check-in and one steady next step can be enough for today. You do not need to do everything at once.",
        helping: [],
        suggestions: [],
        source: "fallback",
      },
      "2026-05-21",
      adaptiveProfile,
      null,
      null,
      null,
      { forceLowEnergyMode: true },
    );

    expect(guidance.actions.length).toBe(1);
    expect(guidance.body.length).toBeLessThanOrEqual(220);
  });
});
