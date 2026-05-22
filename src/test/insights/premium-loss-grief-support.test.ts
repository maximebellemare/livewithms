import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumLossGriefSupport,
  derivePremiumLossGriefSupportSummary,
} from "../../../features/insights/premium-loss-grief-support";
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
      title: "A heavier stretch",
      body: "Some changes still felt emotionally active underneath the week.",
      window: "seasonal",
    },
    longWindowPatterns: [],
    continuitySignals: [
      {
        title: "Ordinary anchors still returned",
        body: "A few routines still kept showing up even while parts of life felt changed.",
        kind: "grounding",
      },
    ],
    seasonalRhythms: [],
    recoveryCycles: [
      {
        pace: "slower",
        body: "A slower pace showed up through heavier periods.",
      },
    ],
    selectedReflections: [],
    memoryResurfacing: {
      shouldResurface: false,
      title: "A quieter note from earlier",
      body: "Steadier moments existed before.",
      reflection: null,
    },
    entries: [],
  };
}

describe("premium loss grief support", () => {
  it("builds calm grief grounding support without therapy or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.2 : 3,
        mood: index < 8 ? 2.4 : 3.1,
        notes:
          index < 5
            ? "I feel grief about the old version of life and sadness about what changed. I should be over this but I am not."
            : null,
      }),
    );

    const result = derivePremiumLossGriefSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.griefGroundingSupport,
      ...result.coexistenceWithLossSupport,
      ...result.ordinaryLifeStillMattersSupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/grief|loss|ordinary|anchor|change|heavy/);
    expect(combined).not.toMatch(
      /heal your grief|transform your pain|ai emotional healing|healing journey|therapy|self-help|inspirational|grief counseling/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumLossGriefSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumLossGriefSupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.1,
          mood: 2.5,
          notes: index < 3 ? "I feel grief about what changed and miss the old version of life." : null,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.griefGroundingSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.ordinaryLifeStillMattersSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumLossGriefSupport(true, true)).toBe(true);
    expect(canAccessPremiumLossGriefSupport(true, false)).toBe(false);
    expect(canAccessPremiumLossGriefSupport(false, true)).toBe(false);
  });
});
