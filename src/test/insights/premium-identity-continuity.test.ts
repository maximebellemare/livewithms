import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumIdentityContinuity,
  derivePremiumIdentityContinuitySummary,
} from "../../../features/insights/premium-identity-continuity";
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
      title: "A changing stretch",
      body: "Some weeks appeared less predictable than others.",
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
        title: "Returning still matters",
        body: "Coming back after harder periods still belongs to continuity.",
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

describe("premium identity continuity", () => {
  it("builds calm self-connection summaries without transformation framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4.1 : 3,
        stress: index < 8 ? 4.2 : 3,
        mood: index < 8 ? 2.4 : 3.1,
        triggers: index % 6 === 0 ? ["travel"] : index % 7 === 0 ? ["rest day"] : [],
        wins: index % 8 === 0 ? ["small win"] : [],
        notes:
          index < 5
            ? "I feel fragmented, not myself lately, and like change is pulling me away from steady parts of life."
            : index % 9 === 0
              ? "A walk and cooking helped me feel a little more familiar."
              : null,
      }),
    );

    const result = derivePremiumIdentityContinuitySummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.selfConnectionSupport,
      ...result.groundingThroughChangeSupport,
      ...result.ordinaryLifeContinuitySupport,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/yourself|continuity|ordinary|steady|quieter/);
    expect(combined).not.toMatch(
      /reinvent yourself|identity transformation|ai self-discovery|finding your true self|therapy|self-help/,
    );
  });

  it("keeps low-energy summaries shorter and supports fallback", () => {
    const shortResult = derivePremiumIdentityContinuitySummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shortResult.hasEnoughData).toBe(false);
    expect(shortResult.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const longerResult = derivePremiumIdentityContinuitySummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
          notes: "I feel fragmented and not myself during this change.",
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(longerResult.selfConnectionSupport.length).toBeLessThanOrEqual(1);
    expect(longerResult.groundingThroughChangeSupport.length).toBeLessThanOrEqual(1);
    expect(longerResult.ordinaryLifeContinuitySupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumIdentityContinuity(true, true)).toBe(true);
    expect(canAccessPremiumIdentityContinuity(true, false)).toBe(false);
    expect(canAccessPremiumIdentityContinuity(false, true)).toBe(false);
  });
});
