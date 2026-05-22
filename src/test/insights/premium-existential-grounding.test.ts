import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumExistentialGrounding,
  derivePremiumExistentialGroundingSummary,
} from "../../../features/insights/premium-existential-grounding";
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
        body: "Returning after harder stretches has still been part of the longer picture.",
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

describe("premium existential grounding", () => {
  it("builds existential grounding support without therapy or self-help framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.2 : 3,
        mood: index < 8 ? 2.4 : 3.1,
        notes:
          index < 5
            ? "I keep thinking what's the point and everything feels empty and existential right now."
            : null,
      }),
    );

    const result = derivePremiumExistentialGroundingSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.existentialGroundingSupport,
      ...result.reducedExistentialPressureSupport,
      ...result.ordinaryLifeAnchoringSupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/meaning|question|ordinary|steadier|existential|point/);
    expect(combined).not.toMatch(
      /discover your purpose|transform your mindset|ai existential guidance|therapy|self-help|spiritual|purpose discovery/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumExistentialGroundingSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumExistentialGroundingSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.1,
          mood: 2.5,
          notes: index < 3 ? "I keep wondering what is the point right now." : null,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.existentialGroundingSupport.length).toBeLessThanOrEqual(1);
    expect(shorter.ordinaryLifeAnchoringSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumExistentialGrounding(true, true)).toBe(true);
    expect(canAccessPremiumExistentialGrounding(true, false)).toBe(false);
    expect(canAccessPremiumExistentialGrounding(false, true)).toBe(false);
  });
});
