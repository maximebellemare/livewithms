import { describe, expect, it } from "vitest";
import type { DailyCheckIn } from "../../../features/checkins/types";
import {
  canAccessPremiumEmotionalCollapseSupport,
  derivePremiumEmotionalCollapseSupportSummary,
} from "../../../features/insights/premium-emotional-collapse-support";
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
      body: "Some days felt more flooded than others.",
      window: "seasonal",
    },
    longWindowPatterns: [],
    continuitySignals: [
      {
        title: "Grounding still returned",
        body: "Grounding kept returning after harder days.",
        kind: "grounding",
      },
      {
        title: "Steadier moments still returned",
        body: "Return patterns still showed up after spikes.",
        kind: "return",
      },
    ],
    seasonalRhythms: [],
    recoveryCycles: [
      {
        pace: "slower",
        body: "A slower recovery pace kept appearing.",
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

describe("premium emotional collapse support", () => {
  it("builds overwhelm grounding support without crisis or therapy framing", () => {
    const entries = Array.from({ length: 21 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 8 ? 4 : 3,
        stress: index < 8 ? 4.3 : 3,
        mood: index < 8 ? 2.4 : 3.1,
        notes:
          index < 5
            ? "Everything feels too much and I feel emotionally flooded and shut down after overwhelm."
            : null,
      }),
    );

    const result = derivePremiumEmotionalCollapseSupportSummary(entries, buildSnapshot());
    const combined = [
      result.atAGlance,
      ...result.emotionalCollapseGrounding,
      ...result.overwhelmDecompressionSupport,
      ...result.smallerEmotionalLoadSupport,
      result.continuityNote,
    ].join(" ").toLowerCase();

    expect(result.hasEnoughData).toBe(true);
    expect(combined).toMatch(/solve everything|quieter pace|grounding|smaller|flooded|overwhelm/);
    expect(combined).not.toMatch(
      /emotional healing|ai crisis support|mental resilience mastery|therapy|self-help|crisis|mental toughness|inspirational/,
    );
  });

  it("keeps low-energy summaries shorter and uses a calm fallback", () => {
    const fallback = derivePremiumEmotionalCollapseSupportSummary(
      [buildEntry(getDateDaysAgo(0)), buildEntry(getDateDaysAgo(1))],
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(fallback.hasEnoughData).toBe(false);
    expect(fallback.fallbackMessage).toBe("More gentle patterns may appear over time.");

    const shorter = derivePremiumEmotionalCollapseSupportSummary(
      Array.from({ length: 12 }, (_, index) =>
        buildEntry(getDateDaysAgo(index), {
          fatigue: 4,
          stress: 4.1,
          mood: 2.5,
          notes: index < 3 ? "Everything feels too much and emotionally flooded." : null,
        }),
      ),
      buildSnapshot(),
      { lowEnergyMode: true },
    );

    expect(shorter.emotionalCollapseGrounding.length).toBeLessThanOrEqual(1);
    expect(shorter.smallerEmotionalLoadSupport.length).toBeLessThanOrEqual(1);
  });

  it("gates access only for active premium users with the feature enabled", () => {
    expect(canAccessPremiumEmotionalCollapseSupport(true, true)).toBe(true);
    expect(canAccessPremiumEmotionalCollapseSupport(true, false)).toBe(false);
    expect(canAccessPremiumEmotionalCollapseSupport(false, true)).toBe(false);
  });
});
