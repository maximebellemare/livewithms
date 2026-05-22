import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumSelfReconnectionSupport,
  derivePremiumSelfReconnectionSupportSummary,
} from "../../../features/insights/premium-self-reconnection-support";
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
      {
        title: "Gentle return",
        body: "Returning after harder stretches has still been part of the longer picture.",
        kind: "return",
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

describe("premium self reconnection support", () => {
  it("builds self-reconnection support without transformation or self-help framing", () => {
    const entries = Array.from({ length: 28 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 10 ? 4 : 3,
        stress: index < 10 ? 4.2 : 3,
        mood: index < 10 ? 2.4 : 3.1,
        notes:
          index < 5
            ? "I do not feel like myself anymore and I feel far from myself after this long difficult stretch."
            : null,
      }),
    );

    const result = derivePremiumSelfReconnectionSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.gentleSelfReconnectionSupport,
      ...result.reducedIdentityPressureSupport,
      ...result.ordinaryLifeReconnectionSupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/yourself|familiar|ordinary|return|steadiness/);
    expect(combined).not.toMatch(
      /rediscover yourself|transform your identity|ai emotional healing|find your true self|therapy|self-help|inspirational|reinvention/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumSelfReconnectionSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumSelfReconnectionSupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.1,
          mood: 2.5,
          notes: index < 3 ? "I feel far from myself right now." : null,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.gentleSelfReconnectionSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.ordinaryLifeReconnectionSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumSelfReconnectionSupport(true, true)).toBe(true);
    expect(canAccessPremiumSelfReconnectionSupport(true, false)).toBe(false);
    expect(canAccessPremiumSelfReconnectionSupport(false, true)).toBe(false);
  });
});
