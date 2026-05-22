import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumEmotionalNumbness,
  derivePremiumEmotionalNumbnessSummary,
} from "../../../features/insights/premium-emotional-numbness";
import type { JourneySnapshot } from "../../../lib/journey-design/types";

function getDateDaysAgo(daysAgo: number) {
  const date = new Date("2026-05-21T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildEntry(date: string, overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: date,
    user_id: "user-1",
    date,
    fatigue: 3,
    pain: 2,
    brain_fog: 2,
    mood: 3,
    mobility: 3,
    stress: 3,
    sleep_hours: 7,
    water_glasses: 6,
    notes: null,
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: `${date}T12:00:00.000Z`,
    updated_at: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}

function buildSnapshot(): JourneySnapshot {
  return {
    seasonalSummary: {
      title: "A mixed stretch",
      body: "Some weeks appeared steadier than others.",
      window: "seasonal",
    },
    longWindowPatterns: [],
    continuitySignals: [
      {
        title: "Grounding kept returning",
        body: "Grounding routines kept returning in small ways across changing days.",
        kind: "grounding",
      },
    ],
    seasonalRhythms: [],
    recoveryCycles: [
      {
        pace: "slower",
        body: "A slower pace showed up at times.",
      },
    ],
    selectedReflections: [],
    memoryResurfacing: {
      shouldResurface: false,
      title: "A quieter note from earlier",
      body: "A steadier moment existed before.",
      reflection: null,
    },
    entries: [],
  };
}

describe("premium emotional numbness", () => {
  it("builds grounding support without therapy or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.1 : 3,
        mood: index < 8 ? 2.4 : 3,
        triggers: index % 7 === 0 ? ["rest day"] : index % 9 === 0 ? ["social day"] : [],
        wins: index % 6 === 0 ? ["small win"] : [],
        notes:
          index < 6
            ? "I feel emotionally numb, flat, and disconnected and nothing feels real or meaningful."
            : index % 8 === 0
              ? "A quiet walk and tea helped a little."
              : null,
      }),
    );

    const result = derivePremiumEmotionalNumbnessSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.gentleDisconnectionSupport,
      ...result.ordinaryLifeGroundingSupport,
      ...result.gentleReconnectionSupport,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/emotionally|ordinary|grounding|smaller|reconnection|quieter/);
    expect(combined).not.toMatch(
      /heal emotional numbness|ai emotional healing|transform your emotional life|therapy|self-help|find joy|gratitude/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumEmotionalNumbnessSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumEmotionalNumbnessSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
          notes: "I feel emotionally distant and flat lately.",
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.gentleDisconnectionSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.gentleReconnectionSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumEmotionalNumbness(true, true)).toBe(true);
    expect(canAccessPremiumEmotionalNumbness(true, false)).toBe(false);
    expect(canAccessPremiumEmotionalNumbness(false, true)).toBe(false);
  });
});
