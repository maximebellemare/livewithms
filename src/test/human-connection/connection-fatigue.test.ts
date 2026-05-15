import { describe, expect, it } from "vitest";
import { deriveConnectionFatigueState } from "../../../lib/human-connection/connection-fatigue/deriveConnectionFatigueState";
import { deriveSocialDensity } from "../../../lib/human-connection/connection-fatigue/deriveSocialDensity";

describe("human connection fatigue protection", () => {
  it("suppresses connection surfaces during overwhelmed states", () => {
    const state = deriveConnectionFatigueState({
      adaptiveStatePrimary: "OVERWHELMED",
      hasStackedEmotionalSurfaces: true,
      aiSummaryVisible: true,
      notePreview: "This feels very hard and deeply overwhelming and intense.",
    });

    expect(state).toBe("suppressed");
    expect(deriveSocialDensity(state)).toBe("minimal");
  });

  it("softens connection during low-energy states", () => {
    const state = deriveConnectionFatigueState({
      adaptiveStatePrimary: "LOW_ENERGY",
      hasStackedEmotionalSurfaces: false,
      aiSummaryVisible: false,
      notePreview: null,
    });

    expect(state).toBe("softened");
  });
});

