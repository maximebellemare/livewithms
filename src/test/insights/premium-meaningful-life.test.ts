import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumMeaningfulLife,
  derivePremiumMeaningfulLifeSummary,
} from "../../../features/insights/premium-meaningful-life";
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
    selectedReflections: [
      {
        date: getDateDaysAgo(5),
        text: "Cooking helped me feel ordinary again.",
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

describe("premium meaningful life", () => {
  it("builds grounded life-beyond-symptoms summaries without identity-overwriting language", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        triggers: index % 7 === 0 ? ["social day"] : index % 9 === 0 ? ["rest day"] : [],
        wins: index % 5 === 0 ? ["small win"] : [],
        notes: index < 4 ? "Reading and cooking helped things feel more ordinary." : null,
      }),
    );

    const result = derivePremiumMeaningfulLifeSummary(entries, buildSnapshot());

    expect(result.hasEnoughData).toBe(true);
    expect(result.atAGlance.toLowerCase()).toContain("ordinary");
    expect(
      `${result.atAGlance} ${result.ordinaryLifeGrounding.join(" ")} ${result.meaningfulRoutines.join(" ")} ${result.continuityNote}`.toLowerCase(),
    ).not.toMatch(/warrior|healing journey|transform your mindset|become stronger|gratitude practice/);
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumMeaningfulLifeSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumMeaningfulLifeSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          notes: "Music helped me feel a little more ordinary.",
          wins: ["small win"],
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.ordinaryLifeGrounding.length).toBeLessThanOrEqual(1);
    expect(shorter.emotionalSpaciousness.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumMeaningfulLife(true, true)).toBe(true);
    expect(canAccessPremiumMeaningfulLife(true, false)).toBe(false);
    expect(canAccessPremiumMeaningfulLife(false, true)).toBe(false);
  });
});
