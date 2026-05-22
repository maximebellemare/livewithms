import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumOverloadRecovery,
  derivePremiumOverloadRecoverySummary,
} from "../../../features/insights/premium-overload-recovery";
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

describe("premium overload recovery", () => {
  it("builds decompression support without therapy or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.2 : 3,
        triggers: index % 6 === 0 ? ["social day"] : [],
        notes: index < 5 ? "Too much people and noise left me mentally drained and overstimulated." : null,
      }),
    );

    const result = derivePremiumOverloadRecoverySummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.socialDecompressionSupport,
      ...result.overstimulationRecovery,
      ...result.quietRecoveryTools,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/quiet|input|decompression|overloaded|noise|people/);
    expect(combined).not.toMatch(/social resilience training|advanced emotional recovery|ai emotional regulation|mental toughness/);
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumOverloadRecoverySummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumOverloadRecoverySummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.2,
          triggers: ["social day"],
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.socialDecompressionSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.quietRecoveryTools.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumOverloadRecovery(true, true)).toBe(true);
    expect(canAccessPremiumOverloadRecovery(true, false)).toBe(false);
    expect(canAccessPremiumOverloadRecovery(false, true)).toBe(false);
  });
});
