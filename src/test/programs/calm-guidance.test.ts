import { describe, expect, it } from "vitest";
import { deriveCalmGuidance } from "../../../features/programs/calm-guidance";

describe("calm guidance", () => {
  it("surfaces simpler prioritization tools during heavier moments", () => {
    const result = deriveCalmGuidance({
      fatigueTrend: "high",
      stressTrend: "elevated",
      brainFog: 4,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds).toContain("one-priority-planner");
    expect(result.surfacedToolIds).toContain("simplify-the-next-hour");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps guidance copy free of productivity and dependency language", () => {
    const result = deriveCalmGuidance({
      fatigueTrend: "steady",
      stressTrend: "steady",
      brainFog: null,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body} ${result.prompts.join(" ")}`.toLowerCase()).not.toMatch(
      /advanced productivity|decision optimization|personal performance assistant|maximize your potential|high performance|hustle|life coaching|personal ai planner|always here for you/,
    );
  });
});
