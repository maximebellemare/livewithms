import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import { deriveAdaptiveContinuity, deriveContinuitySummary } from "../../../lib/continuity-intelligence";
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
    seasonalSummary: null,
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
    seasonalRhythms: [],
    recoveryCycles: [{ pace: "slower", body: "A slower pace showed up at times." }],
    selectedReflections: [
      {
        date: getDateDaysAgo(10),
        text: "I kept the day simpler.",
        reason: "pacing",
      },
    ],
    memoryResurfacing: null,
    entries: [],
  };
}

describe("unified continuity intelligence", () => {
  it("builds calm weekly and long-view summaries from one orchestration path", () => {
    const entries = Array.from({ length: 120 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 30 ? 4 : 3,
        stress: index < 30 ? 4 : 3,
        sleep_hours: index < 30 ? 5.8 : 7,
        mood: index < 30 ? 2.7 : 3.2,
        notes: index % 8 === 0 ? "Kept things simple." : null,
        wins: index % 9 === 0 ? ["small win"] : [],
        triggers: index % 10 === 0 ? ["rest day"] : [],
      }),
    );

    const result = deriveContinuitySummary({
      entries,
      snapshot: buildSnapshot(),
    });

    expect(result.reflections.weekly.hasEnoughData).toBe(true);
    expect(result.snapshots.monthly.hasEnoughData).toBe(true);
    expect(result.reflections.weekly.atAGlance.toLowerCase()).toContain("fatigue");
    expect(result.snapshots.monthly.lifeBeyondSymptoms.length).toBeGreaterThan(0);
  });

  it("reduces density gently in low-energy continuity mode", () => {
    const entries = Array.from({ length: 40 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4,
        stress: 4,
        sleep_hours: 5.5,
        notes: "A short reflection.",
      }),
    );

    const result = deriveContinuitySummary({
      entries,
      snapshot: buildSnapshot(),
      lowEnergyMode: true,
    });

    expect(result.reflections.weekly.patternsWorthNoticing.length).toBeLessThanOrEqual(1);
    expect(result.snapshots.monthly.meaningfulMoments.length).toBeLessThanOrEqual(1);
  });

  it("keeps adaptive continuity subtle and free of invasive framing", () => {
    const result = deriveAdaptiveContinuity({
      totalCheckIns: 12,
      weeklyCheckIns: 2,
      streak: 1,
      recentFatigueAverage: 4.2,
      recentStressAverage: 4,
    });

    expect(`${result.title} ${result.body} ${result.compact}`.toLowerCase()).not.toMatch(
      /therapy|ai companion|journey|transform|always here for you/,
    );
    expect(result.reduceEmotionalIntensity).toBe(true);
  });
});
