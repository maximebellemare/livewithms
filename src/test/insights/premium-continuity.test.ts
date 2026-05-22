import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  buildPremiumContinuityExportContent,
  canAccessPremiumContinuity,
  derivePremiumContinuitySnapshots,
} from "../../../features/insights/premium-continuity";
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
      title: "A steadier season",
      body: "Some weeks appeared steadier than others.",
      window: "seasonal",
    },
    longWindowPatterns: [
      {
        key: "rest-pacing",
        title: "Pacing returned",
        body: "Short grounding routines appeared repeatedly during difficult periods.",
        confidence: "moderate",
      },
    ],
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
    seasonalRhythms: [
      {
        season: "mixed",
        title: "Mixed rhythm",
        body: "Some weeks appeared steadier than others.",
      },
    ],
    recoveryCycles: [
      {
        pace: "slower",
        body: "A slower pace showed up at times.",
      },
    ],
    selectedReflections: [
      {
        date: getDateDaysAgo(15),
        text: "I kept the day quieter.",
        reason: "pacing",
      },
      {
        date: getDateDaysAgo(48),
        text: "A short walk helped.",
        reason: "grounding",
      },
    ],
    memoryResurfacing: {
      shouldResurface: true,
      title: "A quieter note from earlier",
      body: "A steadier moment existed before.",
      reflection: {
        date: getDateDaysAgo(48),
        text: "A short walk helped.",
        reason: "grounding",
      },
    },
    entries: [],
  };
}

describe("premium continuity snapshots", () => {
  it("builds calm monthly and seasonal continuity summaries", () => {
    const entries = Array.from({ length: 120 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 30 ? 4 : 3,
        stress: index < 30 ? 4 : 3,
        sleep_hours: index < 30 ? 5.8 : 7,
        mood: index < 30 ? 2.7 : 3.2,
        triggers: index % 10 === 0 ? ["rest day"] : index % 13 === 0 ? ["social day"] : [],
        wins: index % 9 === 0 ? ["small win"] : [],
        notes: index % 8 === 0 ? "Kept things simple." : null,
      }),
    );

    const result = derivePremiumContinuitySnapshots(entries, buildSnapshot());

    expect(result.monthly.hasEnoughData).toBe(true);
    expect(result.seasonal.hasEnoughData).toBe(true);
    expect(result.monthly.atAGlance.toLowerCase()).toContain("fatigue");
    expect(result.monthly.continuityReflection.toLowerCase()).not.toContain("journey");
    expect(result.seasonal.patternsWorthNoticing.join(" ").toLowerCase()).not.toContain("transformation");
    expect(result.monthly.meaningfulMoments.length).toBeGreaterThan(0);
  });

  it("uses a calm fallback when there is not enough long-term data", () => {
    const result = derivePremiumContinuitySnapshots(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
    );

    expect(result.monthly.hasEnoughData).toBe(false);
    expect(result.monthly.fallbackMessage).toBe("More gentle patterns may appear over time.");
    expect(result.seasonal.hasEnoughData).toBe(false);
  });

  it("keeps low-energy continuity summaries shorter", () => {
    const entries = Array.from({ length: 120 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4,
        stress: 4,
        sleep_hours: 5.5,
        wins: ["small win"],
        notes: "Kept things simple.",
      }),
    );

    const result = derivePremiumContinuitySnapshots(entries, buildSnapshot(), { lowEnergyMode: true });

    expect(result.monthly.patternsWorthNoticing.length).toBeLessThanOrEqual(1);
    expect(result.monthly.thingsThatBroughtCalm.length).toBeLessThanOrEqual(1);
    expect(result.monthly.meaningfulMoments.length).toBeLessThanOrEqual(1);
  });

  it("builds a readable continuity export", () => {
    const entries = Array.from({ length: 120 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 30 ? 4 : 3,
        stress: index < 30 ? 4 : 3,
        sleep_hours: index < 30 ? 5.8 : 7,
      }),
    );

    const snapshots = derivePremiumContinuitySnapshots(entries, buildSnapshot());
    const exportContent = buildPremiumContinuityExportContent(snapshots);

    expect(exportContent.title).toContain("continuity");
    expect(exportContent.sections.length).toBeGreaterThanOrEqual(2);
    expect(exportContent.text.toLowerCase()).not.toContain("look how far you've come");
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumContinuity(true, true)).toBe(true);
    expect(canAccessPremiumContinuity(true, false)).toBe(false);
    expect(canAccessPremiumContinuity(false, true)).toBe(false);
  });
});
