import { describe, expect, it } from "vitest";
import { deriveReflectionDepthPreference } from "../../../lib/personalization/reflection-preferences/deriveReflectionDepthPreference";
import { derivePromptStylePreference } from "../../../lib/personalization/reflection-preferences/derivePromptStylePreference";
import { deriveComplexityTolerance } from "../../../lib/personalization/cognitive-complexity/deriveComplexityTolerance";
import { derivePreferredDensity } from "../../../lib/personalization/cognitive-complexity/derivePreferredDensity";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { AdaptiveProfile } from "../../../features/adaptive/types";
import type { InteractionStyleProfile } from "../../../lib/personalization/types";

function buildEntry(id: string, notes: string | null): DailyCheckIn {
  return {
    id,
    user_id: "user-1",
    date: "2026-05-10",
    fatigue: 3,
    pain: null,
    brain_fog: 2,
    mood: 3,
    mobility: null,
    stress: 2,
    sleep_hours: 7,
    water_glasses: 6,
    notes,
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: "2026-05-10T12:00:00.000Z",
    updated_at: "2026-05-10T12:00:00.000Z",
  };
}

function buildAdaptiveProfile(overrides?: Partial<AdaptiveProfile>): AdaptiveProfile {
  return {
    stressTrend: "steady",
    sleepTrend: "steady",
    fatigueTrend: "steady",
    brainFogTrend: "steady",
    engagementPattern: "steady",
    reflectionPattern: "quiet",
    reminderTone: "daily-checkin",
    homeMoment: "A steady day.",
    lowEnergyMode: false,
    simplificationTitle: "Keep it light",
    simplificationBody: "The basics are enough.",
    suggestedProgram: null,
    secondarySuggestedProgram: null,
    preferredSupportStyle: "steady",
    preferredProgramTags: [],
    ...overrides,
  };
}

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

describe("personalization complexity adaptation", () => {
  it("handles sparse data safely and avoids over-inferring depth", () => {
    expect(deriveReflectionDepthPreference([])).toBe("balanced");
  });

  it("prefers deeper reflection only when reflection volume supports it", () => {
    const depth = deriveReflectionDepthPreference([
      buildEntry("1", "This reflection is fairly detailed and explores a few threads about energy, pacing, and how the day felt overall."),
      buildEntry("2", "Another longer reflection that takes time to notice patterns, what helped, and how different parts of the day felt."),
      buildEntry("3", "A third reflection that is long enough to show a real preference for writing more fully and thinking things through."),
    ]);

    expect(depth).toBe("balanced");
  });

  it("reduces complexity for low-energy conditions", () => {
    const tolerance = deriveComplexityTolerance({
      adaptiveProfile: buildAdaptiveProfile({
        lowEnergyMode: true,
      }),
      reflectionDepthPreference: "deeper",
    });

    expect(tolerance).toBe("lower");
    expect(derivePreferredDensity(tolerance)).toBe("minimal");
  });

  it("allows optional depth for reflective users without forcing it", () => {
    const promptStyle = derivePromptStylePreference(
      buildInteractionStyleProfile({
        weights: {
          concise: 0.35,
          reflective: 0.8,
          structured: 0.3,
          openEnded: 0.82,
          reassuranceLight: 0.45,
          reassuranceWarm: 0.62,
          practical: 0.25,
          emotionallyReflective: 0.78,
        },
        primaryStyle: "reflective",
        confidence: 0.8,
      }),
    );

    expect(promptStyle).toBe("open-ended");
  });
});
