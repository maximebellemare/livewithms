import { describe, expect, it } from "vitest";
import { deriveCoachTone } from "../../../lib/personalization/adaptive-tone/deriveCoachTone";
import { deriveReflectionTone } from "../../../lib/personalization/adaptive-tone/deriveReflectionTone";
import type { InteractionStyleProfile } from "../../../lib/personalization/types";

function buildInteractionStyleProfile(
  overrides?: Partial<InteractionStyleProfile>,
): InteractionStyleProfile {
  return {
    weights: {
      concise: 0.5,
      reflective: 0.5,
      structured: 0.5,
      openEnded: 0.5,
      reassuranceLight: 0.5,
      reassuranceWarm: 0.5,
      practical: 0.5,
      emotionallyReflective: 0.5,
    },
    primaryStyle: "concise",
    confidence: 0.6,
    ...overrides,
  };
}

describe("personalization tone adaptation", () => {
  it("keeps coach tone practical when structure is clearly preferred", () => {
    const tone = deriveCoachTone({
      supportStyle: "steady",
      interactionStyle: buildInteractionStyleProfile({
        weights: {
          concise: 0.45,
          reflective: 0.3,
          structured: 0.76,
          openEnded: 0.3,
          reassuranceLight: 0.55,
          reassuranceWarm: 0.4,
          practical: 0.81,
          emotionallyReflective: 0.22,
        },
        primaryStyle: "practical",
        confidence: 0.81,
      }),
      reflectionDepthPreference: "balanced",
    });

    expect(tone).toBe("practical");
  });

  it("allows richer reflection language without changing abruptly into intimacy", () => {
    const tone = deriveReflectionTone({
      supportStyle: "reflective",
      interactionStyle: buildInteractionStyleProfile({
        weights: {
          concise: 0.4,
          reflective: 0.83,
          structured: 0.35,
          openEnded: 0.8,
          reassuranceLight: 0.4,
          reassuranceWarm: 0.6,
          practical: 0.25,
          emotionallyReflective: 0.84,
        },
        primaryStyle: "reflective",
        confidence: 0.82,
      }),
    });

    expect(tone).toBe("emotionally-reflective");
  });
});
