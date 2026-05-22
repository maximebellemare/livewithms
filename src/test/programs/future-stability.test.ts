import { describe, expect, it } from "vitest";
import { deriveFutureStability } from "../../../features/programs/future-stability";

describe("future stability", () => {
  it("surfaces calmer planning support for unpredictable stretches", () => {
    const result = deriveFutureStability({
      fatigueTrend: "high",
      stressTrend: "elevated",
      recentSleepAverage: 5.9,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.planningLines.length).toBeGreaterThan(0);
    expect(result.surfacedToolIds).toContain("smaller-horizon-planning");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps future-planning copy free of productivity and anxiety-heavy framing", () => {
    const result = deriveFutureStability({
      fatigueTrend: "steady",
      stressTrend: "steady",
      recentSleepAverage: 7,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: "gentle-next-week-overview",
    });

    expect(`${result.title} ${result.body} ${result.planningLines.join(" ")} ${result.continuityLine ?? ""}`.toLowerCase()).not.toMatch(
      /master your schedule|high-performance planning|productivity system|prepare for decline|forecasting|optimization/,
    );
  });
});
