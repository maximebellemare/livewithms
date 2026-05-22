import { describe, expect, it } from "vitest";
import { deriveEmotionalReset } from "../../../features/programs/emotional-reset";

describe("emotional reset", () => {
  it("surfaces calmer reset tools first after heavier overload moments", () => {
    const result = deriveEmotionalReset({
      fatigueTrend: "high",
      stressTrend: "elevated",
      brainFog: 4,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds[0]).toBe("sixty-second-quiet-reset");
    expect(result.surfacedToolIds).toContain("slow-things-down-reset");
    expect(result.surfacedToolIds).toContain("reduce-emotional-carryover");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps the tone calm and free of therapy or optimization language", () => {
    const result = deriveEmotionalReset({
      fatigueTrend: "steady",
      stressTrend: "steady",
      brainFog: null,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body} ${result.resetLines.join(" ")}`.toLowerCase()).not.toMatch(
      /emotional healing system|advanced nervous-system optimization|ai emotional regulation|deep healing|spiritual|therapy/,
    );
  });
});
