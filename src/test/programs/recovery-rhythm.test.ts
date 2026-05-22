import { describe, expect, it } from "vitest";
import { deriveRecoveryRhythm } from "../../../features/programs/recovery-rhythm";

describe("recovery rhythm", () => {
  it("surfaces calmer overload observations during clustered heavy stretches", () => {
    const result = deriveRecoveryRhythm({
      fatigueTrend: "high",
      stressTrend: "elevated",
      recentSleepAverage: 5.8,
      recentEntries: [
        { fatigue: 4, stress: 4, sleep_hours: 5.5 },
        { fatigue: 5, stress: 4, sleep_hours: 6 },
        { fatigue: 4, stress: 5, sleep_hours: 5.8 },
        { fatigue: 3, stress: 4, sleep_hours: 6.2 },
      ],
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
    });

    expect(result.observations.length).toBeGreaterThan(0);
    expect(result.suggestions).toContain("A quieter pace may help this week.");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps recovery copy free of optimization and fear-heavy language", () => {
    const result = deriveRecoveryRhythm({
      fatigueTrend: "steady",
      stressTrend: "steady",
      recentSleepAverage: 7,
      recentEntries: [{ fatigue: 2, stress: 2, sleep_hours: 7 }],
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
    });

    expect(`${result.title} ${result.body} ${result.observations.join(" ")} ${result.suggestions.join(" ")}`.toLowerCase()).not.toMatch(
      /optimize recovery|maximize performance|push your limits|advanced recovery intelligence|burnout optimization|performance recovery system|bad week|decline/,
    );
  });
});
