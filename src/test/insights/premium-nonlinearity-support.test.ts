import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumNonlinearitySupport,
  derivePremiumNonlinearitySupportSummary,
} from "../../../features/insights/premium-nonlinearity-support";
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

describe("premium nonlinearity support", () => {
  it("builds calm coexistence support without therapy or spiritual framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4.1 : 3,
        stress: index < 8 ? 4.2 : 3,
        mood: index < 8 ? 2.4 : 3,
        triggers: index % 7 === 0 ? ["rest day"] : [],
        notes:
          index < 6
            ? "I keep asking why can't I stay stable. Everything feels up and down and nonlinear."
            : null,
      }),
    );

    const result = derivePremiumNonlinearitySupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.gentleCoexistenceSupport,
      ...result.reducedRigiditySupport,
      ...result.steadinessWithoutPerfectionSupport,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/steady|fluctuation|perfection|nonlinear|unpredictable|uncertainty/);
    expect(combined).not.toMatch(
      /master uncertainty|emotional resilience optimization|ai emotional mastery|radical acceptance|spiritual|surrender|therapy|self-help/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumNonlinearitySupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumNonlinearitySupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
          notes: "I feel inconsistent and nonlinear lately.",
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.gentleCoexistenceSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.reducedRigiditySupport.length).toBeLessThanOrEqual(1);
    expect(shorter.steadinessWithoutPerfectionSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumNonlinearitySupport(true, true)).toBe(true);
    expect(canAccessPremiumNonlinearitySupport(true, false)).toBe(false);
    expect(canAccessPremiumNonlinearitySupport(false, true)).toBe(false);
  });
});
