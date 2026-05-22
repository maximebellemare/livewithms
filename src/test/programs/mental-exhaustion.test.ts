import { describe, expect, it } from "vitest";
import { deriveMentalExhaustionSupport } from "../../../features/programs/mental-exhaustion";

describe("mental exhaustion support", () => {
  it("surfaces lower-demand recovery tools on depleted days", () => {
    const result = deriveMentalExhaustionSupport({
      fatigueTrend: "high",
      stressTrend: "elevated",
      brainFog: 4,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds[0]).toBe("empty-tank-support");
    expect(result.surfacedToolIds).toContain("mental-rest-permission");
    expect(result.surfacedToolIds).toContain("slower-recovery-pacing");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps the tone calm and free of productivity or therapy framing", () => {
    const result = deriveMentalExhaustionSupport({
      fatigueTrend: "steady",
      stressTrend: "steady",
      brainFog: null,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body} ${result.recoveryLines.join(" ")}`.toLowerCase()).not.toMatch(
      /recover faster|mental performance|ai recovery optimization|maximize recovery|bounce back|productivity|push through|therapy/,
    );
  });
});
