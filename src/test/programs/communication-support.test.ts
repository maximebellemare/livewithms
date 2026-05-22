import { describe, expect, it } from "vitest";
import { deriveCommunicationSupport } from "../../../features/programs/communication-support";

describe("communication support", () => {
  it("surfaces simpler communication tools during heavier social moments", () => {
    const result = deriveCommunicationSupport({
      stressTrend: "elevated",
      fatigueTrend: "high",
      brainFog: 4,
      lowEnergyMode: true,
      lowEnergyAssistActive: true,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(result.surfacedToolIds).toContain("short-ways-to-say-low-energy");
    expect(result.surfacedToolIds).toContain("gentle-boundary-check");
    expect(result.simplifyFurther).toBe(true);
  });

  it("keeps communication support free of manipulative coaching language", () => {
    const result = deriveCommunicationSupport({
      stressTrend: "steady",
      fatigueTrend: "steady",
      brainFog: null,
      lowEnergyMode: false,
      lowEnergyAssistActive: false,
      recentToolIds: [],
      lastOpenedToolId: null,
    });

    expect(`${result.title} ${result.body} ${result.phrases.join(" ")}`.toLowerCase()).not.toMatch(
      /relationship coaching|social optimization|advanced emotional intelligence|ai relationship support|assert dominance|manipulate|control the conversation/,
    );
  });
});
