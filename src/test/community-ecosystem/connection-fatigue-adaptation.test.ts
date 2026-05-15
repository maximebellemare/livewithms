import { describe, expect, it } from "vitest";
import { deriveSocialFatigue } from "../../../lib/community-ecosystem/connection-fatigue-adaptation/deriveSocialFatigue";
import { reduceCommunityDensity } from "../../../lib/community-ecosystem/connection-fatigue-adaptation/reduceCommunityDensity";

describe("community ecosystem connection fatigue adaptation", () => {
  it("raises social fatigue under stacked emotional surfaces", () => {
    const fatigue = deriveSocialFatigue({
      adaptiveStatePrimary: "OVERWHELMED",
      hasStackedEmotionalSurfaces: true,
      aiSummaryVisible: true,
    });

    expect(fatigue).toBe("high");
    expect(reduceCommunityDensity(fatigue)).toBe("minimal");
  });

  it("keeps community light under moderate fatigue", () => {
    const fatigue = deriveSocialFatigue({
      adaptiveStatePrimary: "LOW_ENERGY",
      hasStackedEmotionalSurfaces: false,
      aiSummaryVisible: false,
    });

    expect(reduceCommunityDensity(fatigue)).toBe("light");
  });
});
