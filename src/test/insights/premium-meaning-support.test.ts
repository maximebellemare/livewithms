import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumMeaningSupport,
  derivePremiumMeaningSupportSummary,
} from "../../../features/insights/premium-meaning-support";
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
      title: "A quieter stretch",
      body: "Some weeks appeared steadier than others.",
      window: "seasonal",
    },
    longWindowPatterns: [],
    continuitySignals: [
      {
        title: "Grounding kept returning",
        body: "Grounding routines kept returning in small ways.",
        kind: "grounding",
      },
      {
        title: "Gentle return",
        body: "Returning after harder stretches has still been part of the picture.",
        kind: "return",
      },
    ],
    seasonalRhythms: [],
    recoveryCycles: [],
    selectedReflections: [
      {
        date: getDateDaysAgo(3),
        text: "A quiet walk with family still mattered.",
        reason: "grounding",
      },
    ],
    memoryResurfacing: {
      shouldResurface: false,
      title: "A quieter note from earlier",
      body: "A steadier moment existed before.",
      reflection: null,
    },
    entries: [],
  };
}

describe("premium meaning support", () => {
  it("builds calmer meaning support without inspirational or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        stress: index < 6 ? 4 : 3,
        fatigue: index < 5 ? 4 : 3,
        triggers: index % 7 === 0 ? ["rest day"] : index % 9 === 0 ? ["social day"] : [],
        wins: index % 5 === 0 ? ["small win"] : [],
        notes: index < 4 ? "Reading, cooking, and quiet music still helped." : null,
      }),
    );

    const result = derivePremiumMeaningSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.whatStillMatters,
      ...result.smallerMeaningSupport,
      ...result.emotionalSpaciousness,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toContain("meaning");
    expect(combined).not.toMatch(
      /find your true purpose|discover your purpose|everything happens for a reason|transform your mindset|spiritual/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumMeaningSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumMeaningSupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          notes: "A quiet walk still mattered.",
          wins: ["small win"],
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.whatStillMatters.length).toBeLessThanOrEqual(1);
    expect(shorter.emotionalSpaciousness.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumMeaningSupport(true, true)).toBe(true);
    expect(canAccessPremiumMeaningSupport(true, false)).toBe(false);
    expect(canAccessPremiumMeaningSupport(false, true)).toBe(false);
  });
});
