import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumIdentityRecovery,
  derivePremiumIdentityRecoverySummary,
} from "../../../features/insights/premium-identity-recovery";
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

describe("premium identity recovery", () => {
  it("builds calm self-compassion summaries without therapy or self-help drift", () => {
    const entries = Array.from({ length: 35 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 14 ? 4.2 : 3,
        stress: index < 14 ? 4.1 : 3,
        mood: index < 14 ? 2.4 : 3.1,
        notes: index < 6 ? "I feel guilty and like I should be doing more." : null,
      }),
    );

    const result = derivePremiumIdentityRecoverySummary(entries, buildSnapshot());

    const combined = [
      result.atAGlance,
      ...result.selfCompassionSupport,
      ...result.emotionalRecoverySupport,
      ...result.identityContinuitySupport,
      result.continuityNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).not.toMatch(/therapy|love yourself|healing transformation|transform your self-worth|inspirational/);
    expect(combined).toMatch(/gentleness|value|pressure|self/);
  });

  it("keeps low-energy summaries shorter and supports fallback", () => {
    const shortResult = derivePremiumIdentityRecoverySummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shortResult.hasEnoughData).toBe(false);
    expect(shortResult.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const longerResult = derivePremiumIdentityRecoverySummary(
      Array.from({ length: 14 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4,
          mood: 2.5,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(longerResult.selfCompassionSupport.length).toBeLessThanOrEqual(1);
    expect(longerResult.emotionalRecoverySupport.length).toBeLessThanOrEqual(1);
    expect(longerResult.identityContinuitySupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumIdentityRecovery(true, true)).toBe(true);
    expect(canAccessPremiumIdentityRecovery(true, false)).toBe(false);
    expect(canAccessPremiumIdentityRecovery(false, true)).toBe(false);
  });
});
