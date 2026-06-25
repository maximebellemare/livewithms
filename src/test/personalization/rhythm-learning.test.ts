import { describe, expect, it } from "vitest";
import { derivePreferredCheckinWindows } from "../../../lib/personalization/rhythm-learning/derivePreferredCheckinWindows";
import { deriveEngagementRhythm } from "../../../lib/personalization/rhythm-learning/deriveEngagementRhythm";
import { deriveRecoveryRhythm } from "../../../lib/personalization/rhythm-learning/deriveRecoveryRhythm";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { GrowthState } from "../../../features/growth/types";
import type { AdaptiveProfile } from "../../../features/adaptive/types";

function buildEntry(id: string, updatedAt: string): DailyCheckIn {
  return {
    id,
    user_id: "user-1",
    date: updatedAt.slice(0, 10),
    fatigue: 3,
    pain: null,
    brain_fog: 2,
    mood: 3,
    mobility: null,
    stress: 2,
    sleep_hours: 7,
    water_glasses: 6,
    notes: null,
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}

function buildGrowthState(overrides?: Partial<GrowthState>): GrowthState {
  return {
    firstOpenedAt: "2026-05-01T12:00:00.000Z",
    lastActiveAt: "2026-05-10T12:00:00.000Z",
    activeDates: ["2026-05-01"],
    eventCounts: {},
    recentActions: [],
    seenCelebrations: {},
    reviewPromptedAt: null,
    reviewRequestedAt: null,
    ...overrides,
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

describe("personalization rhythm learning", () => {
  it("learns preferred check-in windows from recent patterns", () => {
    const windows = derivePreferredCheckinWindows(
      [
        buildEntry("1", "2026-05-11T21:30:00-04:00"),
        buildEntry("2", "2026-05-10T20:15:00-04:00"),
        buildEntry("3", "2026-05-09T08:45:00-04:00"),
      ],
      "midday",
    );

    expect(windows).toContain("evening");
    expect(windows).toContain("morning");
  });

  it("stays light for sparse data and steady for sustained activity", () => {
    expect(deriveEngagementRhythm(buildGrowthState())).toBe("light");

    expect(
      deriveEngagementRhythm(
        buildGrowthState({
          activeDates: [
            "2026-05-01",
            "2026-05-02",
            "2026-05-03",
            "2026-05-04",
            "2026-05-05",
            "2026-05-06",
            "2026-05-07",
            "2026-05-08",
            "2026-05-09",
            "2026-05-10",
          ],
          recentActions: new Array(6).fill(null).map((_, index) => ({
            eventName: "check_in_completed" as const,
            occurredAt: `2026-05-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
          })),
        }),
      ),
    ).toBe("steady");
  });

  it("keeps recovery rhythm gentle during re-entry", () => {
    const rhythm = deriveRecoveryRhythm({
      adaptiveProfile: buildAdaptiveProfile({
        engagementPattern: "gentle-reengagement",
      }),
      growthState: buildGrowthState({
        recentActions: [
          {
            eventName: "reflection_saved",
            occurredAt: "2026-05-10T12:00:00.000Z",
          },
        ],
      }),
    });

    expect(rhythm).toBe("quiet-reentry");
  });
});
