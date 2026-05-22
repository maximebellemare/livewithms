import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumFutureFear,
  derivePremiumFutureFearSummary,
} from "../../../features/insights/premium-future-fear";
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
      title: "A shifting stretch",
      body: "Some parts of life still held together in quieter ways.",
      window: "seasonal",
    },
    longWindowPatterns: [],
    continuitySignals: [
      {
        title: "Ordinary anchors still showed up",
        body: "A few routines and ordinary moments still kept returning underneath the uncertainty.",
        kind: "grounding",
      },
    ],
    seasonalRhythms: [],
    recoveryCycles: [
      {
        pace: "slower",
        body: "A slower pace showed up through heavier periods.",
      },
    ],
    selectedReflections: [],
    memoryResurfacing: {
      shouldResurface: false,
      title: "A quieter note from earlier",
      body: "Steadier moments existed before.",
      reflection: null,
    },
    entries: [],
  };
}

describe("premium future fear", () => {
  it("builds calm identity and future fear support without reassurance or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.3 : 3,
        mood: index < 8 ? 2.3 : 3.1,
        notes:
          index < 5
            ? "I am afraid of the future and of becoming unrecognizable. What if my life keeps shrinking and I lose myself?"
            : null,
      }),
    );

    const result = derivePremiumFutureFearSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.futureFearGrounding,
      ...result.identityFearDecompression,
      ...result.stillConnectedToLifeSupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/future|fear|identity|ordinary|anchor|uncertain/);
    expect(combined).not.toMatch(
      /conquer fear|transform your mindset|ai emotional resilience|everything happens for a reason|therapy|self-help|inspirational|discover your true self/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumFutureFearSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumFutureFearSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.1,
          mood: 2.5,
          notes: index < 3 ? "I feel afraid of losing myself when the future feels uncertain." : null,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.futureFearGrounding.length).toBeLessThanOrEqual(1);
    expect(shorter.stillConnectedToLifeSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumFutureFear(true, true)).toBe(true);
    expect(canAccessPremiumFutureFear(true, false)).toBe(false);
    expect(canAccessPremiumFutureFear(false, true)).toBe(false);
  });
});
