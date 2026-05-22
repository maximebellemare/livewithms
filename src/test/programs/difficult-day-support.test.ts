import { describe, expect, it } from "vitest";
import { deriveDifficultDaySupport } from "../../../features/programs/difficult-day-support";

describe("difficult day support", () => {
  it("surfaces ultra-low-demand tools first on heavier days", () => {
    const result = deriveDifficultDaySupport({
      fatigueTrend: "high",
      stressTrend: "elevated",
      brainFog: 4,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds[0]).toBe("everything-feels-too-hard");
    expect(result.surfacedToolIds).toContain("less-pressure-reset");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps the tone calm and free of pressure-heavy language", () => {
    const result = deriveDifficultDaySupport({
      fatigueTrend: "steady",
      stressTrend: "steady",
      brainFog: null,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body} ${result.groundingLines.join(" ")}`.toLowerCase()).not.toMatch(
      /stay strong|keep fighting|push through|toxic positivity|advanced emotional resilience|mental health optimization/,
    );
  });
});
