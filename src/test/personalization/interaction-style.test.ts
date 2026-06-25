import { describe, expect, it } from "vitest";
import { deriveInteractionStyle } from "../../../lib/personalization/interaction-styles/deriveInteractionStyle";
import { evolveInteractionProfile } from "../../../lib/personalization/interaction-styles/evolveInteractionProfile";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { GrowthState } from "../../../features/growth/types";
import type { InteractionStyleProfile } from "../../../lib/personalization/types";

function buildEntry(overrides?: Partial<DailyCheckIn>): DailyCheckIn {
  return {
    id: "entry-1",
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
    notes: "A short note.",
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: "2026-05-10T19:00:00.000Z",
    updated_at: "2026-05-10T19:00:00.000Z",
    ...overrides,
  };
}

function buildGrowthState(overrides?: Partial<GrowthState>): GrowthState {
  return {
    firstOpenedAt: "2026-05-01T12:00:00.000Z",
    lastActiveAt: "2026-05-10T12:00:00.000Z",
    activeDates: ["2026-05-01", "2026-05-04", "2026-05-07", "2026-05-10"],
    eventCounts: {
      reflection_saved: 2,
      ai_coach_message_sent: 5,
    },
    recentActions: [],
    seenCelebrations: {},
    reviewPromptedAt: null,
    reviewRequestedAt: null,
    ...overrides,
  };
}

function buildProfile(overrides?: Partial<InteractionStyleProfile>): InteractionStyleProfile {
  return {
    weights: {
      concise: 0.3,
      reflective: 0.9,
      structured: 0.35,
      openEnded: 0.85,
      reassuranceLight: 0.45,
      reassuranceWarm: 0.55,
      practical: 0.25,
      emotionallyReflective: 0.8,
    },
    primaryStyle: "reflective",
    confidence: 0.88,
    ...overrides,
  };
}

describe("personalization interaction styles", () => {
  it("derives practical and structured tendencies from practical support patterns", () => {
    const style = deriveInteractionStyle({
      supportStyle: "practical",
      entries: [buildEntry(), buildEntry({ id: "entry-2", notes: "Keep it simple." })],
      growthState: buildGrowthState({
        eventCounts: {
          reflection_saved: 1,
          ai_coach_message_sent: 6,
        },
      }),
    });

    expect(style.weights.practical).toBeGreaterThan(0.7);
    expect(style.weights.structured).toBeGreaterThan(0.7);
    expect(style.weights.practical).toBeGreaterThan(style.weights.reflective);
  });

  it("evolves gradually instead of flipping abruptly", () => {
    const next = deriveInteractionStyle({
      supportStyle: "steady",
      entries: [
        buildEntry({ notes: "Short." }),
        buildEntry({ id: "entry-2", notes: "Still short." }),
      ],
      growthState: buildGrowthState({
        eventCounts: {
          reflection_saved: 0,
          ai_coach_message_sent: 8,
        },
      }),
    });

    const evolved = evolveInteractionProfile(buildProfile(), next);

    expect(evolved.weights.reflective).toBeGreaterThan(0.7);
    expect(evolved.weights.concise).toBeLessThan(0.55);
    expect(evolved.primaryStyle).toBe("reflective");
    expect(evolved.confidence).toBeGreaterThan(0.75);
  });
});
