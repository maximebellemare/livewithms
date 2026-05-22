import { describe, expect, it } from "vitest";
import { deriveTransitionSupport } from "../../../features/programs/transition-support";

describe("transition support", () => {
  it("surfaces calmer travel and disrupted-routine guidance without pressure", () => {
    const result = deriveTransitionSupport({
      fatigueTrend: "high",
      stressTrend: "elevated",
      recentEntries: [
        { fatigue: 4, stress: 4, sleep_hours: 5.8, triggers: ["travel"] },
        { fatigue: 4, stress: 5, sleep_hours: 6.1, triggers: ["poor sleep"] },
        { fatigue: 5, stress: 4, sleep_hours: 5.7, triggers: ["stressful day"] },
      ],
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      disruptionDetected: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.summaries.length).toBeGreaterThan(0);
    expect(result.surfacedToolIds).toContain("travel-day-pacing");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps transition copy free of guilt and productivity language", () => {
    const result = deriveTransitionSupport({
      fatigueTrend: "steady",
      stressTrend: "steady",
      recentEntries: [{ fatigue: 2, stress: 2, sleep_hours: 7, triggers: [] }],
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      disruptionDetected: false,
      recentToolIds: [],
      lastOpenedToolId: "gentle-reentry-after-time-away",
    });

    expect(`${result.title} ${result.body} ${result.summaries.join(" ")} ${result.continuityLine ?? ""}`.toLowerCase()).not.toMatch(
      /welcome back|catch up|get back on track|don't lose progress|streak|momentum|travel optimization|high-performance/,
    );
  });
});
