import { describe, expect, it } from "vitest";
import { deriveCognitiveSupport } from "../../../features/programs/cognitive-support";

describe("cognitive support", () => {
  it("surfaces brain-fog tools first when mental noise is high", () => {
    const result = deriveCognitiveSupport({
      brainFog: 4,
      fatigueTrend: "high",
      stressTrend: "elevated",
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds[0]).toBe("too-many-thoughts-at-once");
    expect(result.surfacedToolIds).toContain("one-thing-at-a-time");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps cognitive support copy free of performance language", () => {
    const result = deriveCognitiveSupport({
      brainFog: null,
      fatigueTrend: "steady",
      stressTrend: "steady",
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body}`.toLowerCase()).not.toMatch(
      /optimize your cognition|advanced brain performance|mental enhancement|peak focus|high-performance brain|nootropic/,
    );
  });

  it("preserves lightweight continuity for recent brain-fog tools", () => {
    const result = deriveCognitiveSupport({
      brainFog: null,
      fatigueTrend: "steady",
      stressTrend: "steady",
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: ["brain-fog-clarifier"],
      lastOpenedToolId: "brain-fog-clarifier",
    });

    expect(result.continuityLine).toContain("still here");
  });
});
