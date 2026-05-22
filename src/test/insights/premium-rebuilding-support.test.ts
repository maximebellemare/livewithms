import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumRebuildingSupport,
  derivePremiumRebuildingSupportSummary,
} from "../../../features/insights/premium-rebuilding-support";
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
        body: "A few quieter signs of return have still been present.",
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

describe("premium rebuilding support", () => {
  it("builds calm rebuilding support without motivational or productivity framing", () => {
    const entries = Array.from({ length: 35 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 14 ? 4.2 : 3,
        stress: index < 14 ? 4.2 : 3,
        mood: index < 14 ? 2.5 : 3.1,
        sleep_hours: index < 14 ? 5.9 : 7,
        triggers: index % 8 === 0 ? ["rest day"] : index % 11 === 0 ? ["travel"] : [],
        wins: index % 7 === 0 ? ["small win"] : [],
        notes:
          index < 6
            ? "I feel burned out, in survival mode, and like rebuilding after this long hard period is slow."
            : index % 9 === 0
              ? "A walk and tea helped a little."
              : null,
      }),
    );

    const result = derivePremiumRebuildingSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.gentleRebuildingSupport,
      ...result.postOverwhelmDecompression,
      ...result.gentleRoutineReconstruction,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/rebuild|slower|routine|pressure|gentler|return/);
    expect(combined).not.toMatch(
      /burnout recovery system|optimi[sz]e your comeback|ai resilience rebuilding|bounce back stronger|push through|high performance comeback|optimi[sz]e recovery|therapy|self-help/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumRebuildingSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumRebuildingSupportSummary(
      Array.from({ length: 14 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
          notes: "I feel burned out and like rebuilding is slow.",
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.gentleRebuildingSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.postOverwhelmDecompression.length).toBeLessThanOrEqual(1);
    expect(shorter.gentleRoutineReconstruction.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumRebuildingSupport(true, true)).toBe(true);
    expect(canAccessPremiumRebuildingSupport(true, false)).toBe(false);
    expect(canAccessPremiumRebuildingSupport(false, true)).toBe(false);
  });
});
