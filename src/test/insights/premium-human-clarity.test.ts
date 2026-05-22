import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumHumanClarity,
  derivePremiumHumanClaritySummary,
} from "../../../features/insights/premium-human-clarity";
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

describe("premium human clarity", () => {
  it("builds calm self-understanding summaries without over-psychologizing", () => {
    const entries = Array.from({ length: 35 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 14 ? 4 : 3,
        stress: index < 14 ? 4 : 3,
        mood: index < 14 ? 2.4 : 3.1,
        sleep_hours: index < 14 ? 5.8 : 7,
        notes: index < 5 ? "Keeping things simpler helped." : null,
      }),
    );

    const result = derivePremiumHumanClaritySummary(entries, buildSnapshot());

    expect(result.hasEnoughData).toBe(true);
    expect(result.atAGlance.toLowerCase()).toContain("lower-energy");
    expect(result.whatMayBeHappeningLately.join(" ").toLowerCase()).not.toMatch(
      /diagnosis|psychoanalysis|mental health analysis|understand yourself completely/,
    );
    expect(result.whatMayDeserveLessPressure.join(" ").toLowerCase()).toContain("pressure");
  });

  it("keeps low-energy summaries shorter and supports calm fallback", () => {
    const shortResult = derivePremiumHumanClaritySummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shortResult.hasEnoughData).toBe(false);
    expect(shortResult.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const longerResult = derivePremiumHumanClaritySummary(
      Array.from({ length: 14 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          sleep_hours: 5.8,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(longerResult.whatMayBeHappeningLately.length).toBeLessThanOrEqual(1);
    expect(longerResult.whatMayDeserveLessPressure.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumHumanClarity(true, true)).toBe(true);
    expect(canAccessPremiumHumanClarity(true, false)).toBe(false);
    expect(canAccessPremiumHumanClarity(false, true)).toBe(false);
  });
});
