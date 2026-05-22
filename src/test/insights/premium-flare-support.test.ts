import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumFlareSupport,
  derivePremiumFlareSupportSummary,
} from "../../../features/insights/premium-flare-support";
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

describe("premium flare support", () => {
  it("builds calmer symptom-period support without medical framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4.2 : 3,
        stress: index < 8 ? 4.1 : 3,
        mood: index < 8 ? 2.5 : 3.1,
        symptom_tags: index < 6 ? ["fatigue", "pain", "brain_fog"] : [],
        notes: index < 5 ? "Today felt like a flare and too many symptoms felt loud at once." : null,
      }),
    );

    const result = derivePremiumFlareSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.groundingDuringHeavierDays,
      ...result.symptomOverwhelmDecompression,
      ...result.simplifyTodaySupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/heavier|symptom|gentler pace|simpler|stimulation/);
    expect(combined).not.toMatch(/diagnosis|treatment recommendation|medical advice|prediction|ai health monitoring/);
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumFlareSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumFlareSupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4.2,
          stress: 4.1,
          symptom_tags: ["fatigue", "pain", "brain_fog"],
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.groundingDuringHeavierDays.length).toBeLessThanOrEqual(1);
    expect(shorter.simplifyTodaySupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumFlareSupport(true, true)).toBe(true);
    expect(canAccessPremiumFlareSupport(true, false)).toBe(false);
    expect(canAccessPremiumFlareSupport(false, true)).toBe(false);
  });
});
