import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumReflectionSummaries,
  derivePremiumReflectionSummaries,
} from "../../../features/insights/premium-reflections";

function getDateDaysAgo(daysAgo: number) {
  const date = new Date("2026-05-21T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildEntry(
  date: string,
  overrides: Partial<DailyCheckIn> = {},
): DailyCheckIn {
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

describe("premium reflection summaries", () => {
  it("builds weekly and monthly summaries with calm phrasing", () => {
    const entries = Array.from({ length: 40 }, (_, index) => {
      const date = getDateDaysAgo(index);
      return buildEntry(date, {
        fatigue: index < 7 ? 4 + (index % 2) : 3,
        stress: index < 7 ? 4 : 3,
        sleep_hours: index < 7 ? 5.5 : 7,
        mood: index < 7 ? 2.5 : 3.2,
        water_glasses: index < 7 ? 4 : 6,
        notes: index < 6 ? "A short reflection." : null,
      });
    });

    const result = derivePremiumReflectionSummaries(entries);

    expect(result.weekly.hasEnoughData).toBe(true);
    expect(result.monthly.hasEnoughData).toBe(true);
    expect(result.weekly.atAGlance.toLowerCase()).toContain("fatigue");
    expect(result.weekly.whatMayHelpNext.join(" ").toLowerCase()).toContain("simpler routines");
    expect(result.monthly.continuitySummary.toLowerCase()).not.toContain("worsening");
  });

  it("uses a calm fallback when there is not enough data", () => {
    const result = derivePremiumReflectionSummaries([
      buildEntry("2026-05-21"),
      buildEntry("2026-05-20"),
    ]);

    expect(result.weekly.hasEnoughData).toBe(false);
    expect(result.weekly.fallbackMessage).toBe("More gentle patterns may appear over time.");
    expect(result.monthly.hasEnoughData).toBe(false);
  });

  it("keeps low-energy summaries shorter", () => {
    const entries = Array.from({ length: 14 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4,
        stress: 4,
        sleep_hours: 5.5,
        water_glasses: 4,
      }),
    );

    const result = derivePremiumReflectionSummaries(entries, { lowEnergyMode: true });

    expect(result.weekly.patternsWorthNoticing.length).toBeLessThanOrEqual(1);
    expect(result.weekly.whatMayHelpNext.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumReflectionSummaries(true, true)).toBe(true);
    expect(canAccessPremiumReflectionSummaries(true, false)).toBe(false);
    expect(canAccessPremiumReflectionSummaries(false, true)).toBe(false);
  });
});
