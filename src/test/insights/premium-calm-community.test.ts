import { describe, expect, it } from "vitest";
import {
  canAccessPremiumCalmCommunity,
  derivePremiumCalmCommunitySummary,
} from "../../../features/insights/premium-calm-community";

describe("premium calm community", () => {
  it("keeps community framing low-pressure and free of social-media dynamics", () => {
    const result = derivePremiumCalmCommunitySummary({
      hasPremiumAccess: true,
      featureEnabled: true,
      density: "light",
      safeSpaces: ["pacing", "fatigue", "sleep"],
      lowPressureTopics: ["pacing through slower days", "rest and lower-energy stretches"],
      sharedHumanThemes: ["needing gentler pacing"],
      note: {
        title: "A quieter shared note",
        body: "People sometimes need gentler pacing too.",
      },
      fatigue: "moderate",
      lowEnergyMode: false,
    });

    expect(result.hasEnoughData).toBe(true);
    expect(
      `${result.atAGlance} ${result.sharedExperiences.join(" ")} ${result.gentleInteractions.join(" ")} ${result.moderationNotes.join(" ")}`.toLowerCase(),
    ).not.toMatch(/exclusive community|followers|likes|top contributors|viral|ranking|trending|endless scroll/);
  });

  it("keeps low-energy community summaries shorter and calmer", () => {
    const result = derivePremiumCalmCommunitySummary({
      hasPremiumAccess: true,
      featureEnabled: true,
      density: "minimal",
      safeSpaces: ["pacing", "fatigue"],
      lowPressureTopics: ["pacing through slower days", "rest and lower-energy stretches"],
      sharedHumanThemes: ["shared difficulty"],
      note: null,
      fatigue: "high",
      lowEnergyMode: true,
    });

    expect(result.sharedExperiences.length).toBeLessThanOrEqual(2);
    expect(result.gentleInteractions.length).toBeLessThanOrEqual(2);
    expect(result.moderationNotes.length).toBeLessThanOrEqual(2);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumCalmCommunity(true, true)).toBe(true);
    expect(canAccessPremiumCalmCommunity(true, false)).toBe(false);
    expect(canAccessPremiumCalmCommunity(false, true)).toBe(false);
  });
});
