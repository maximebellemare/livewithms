import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumLongTermStability,
  derivePremiumLongTermStabilitySummary,
} from "../../../features/insights/premium-long-term-stability";
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

describe("premium long-term stability", () => {
  it("builds calm long-view support without coaching or self-help drift", () => {
    const entries = Array.from({ length: 35 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 14 ? 4 : 3,
        stress: index < 14 ? 4.2 : 3,
        mood: index < 14 ? 2.5 : 3.1,
        sleep_hours: index < 14 ? 5.9 : 7,
        triggers: index % 8 === 0 ? ["rest day"] : index % 11 === 0 ? ["travel"] : [],
        wins: index % 7 === 0 ? ["small win"] : [],
        notes:
          index < 6
            ? "I feel pressure to figure everything out and create a perfect plan for the future."
            : index % 9 === 0
              ? "A walk and cooking helped me feel steadier."
              : null,
      }),
    );

    const result = derivePremiumLongTermStabilitySummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.gentleDirectionSupport,
      ...result.slowStabilitySupport,
      ...result.groundingThroughOrdinaryLife,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/steadier|smaller|ordinary|pace|future|stability/);
    expect(combined).not.toMatch(
      /life mastery|ai life coaching|transform your future|purpose optimization|build your best life|therapy|self-help/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumLongTermStabilitySummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumLongTermStabilitySummary(
      Array.from({ length: 14 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
          notes: "I feel pressure to figure everything out over time.",
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.gentleDirectionSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.slowStabilitySupport.length).toBeLessThanOrEqual(1);
    expect(shorter.groundingThroughOrdinaryLife.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumLongTermStability(true, true)).toBe(true);
    expect(canAccessPremiumLongTermStability(true, false)).toBe(false);
    expect(canAccessPremiumLongTermStability(false, true)).toBe(false);
  });
});
