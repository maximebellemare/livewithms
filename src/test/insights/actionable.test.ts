import { describe, expect, it } from "vitest";
import {
  derivePatternsWorthNoticing,
  deriveSmallNextSteps,
  deriveWeeklyMeaning,
  deriveWhatChangedRecently,
  sanitizeInsightSafety,
} from "../../../features/insights/actionable";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { CorrelationSummary, TrendSummary } from "../../../features/insights/types";

function buildEntry(
  date: string,
  overrides: Partial<DailyCheckIn> = {},
): DailyCheckIn {
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

describe("insights actionable copy", () => {
  it("creates calm weekly meaning and suggestions", () => {
    const entries = [
      buildEntry("2026-05-21", { fatigue: 5, stress: 4, sleep_hours: 5 }),
      buildEntry("2026-05-20", { fatigue: 4, stress: 4, sleep_hours: 6 }),
      buildEntry("2026-05-19", { fatigue: 5, stress: 5, sleep_hours: 5 }),
      buildEntry("2026-05-18", { fatigue: 4, stress: 4, sleep_hours: 6 }),
    ];

    const result = deriveWeeklyMeaning(entries);
    expect(result.observations[0]).toContain("Fatigue appears a little heavier recently.");
    expect(result.suggestions.join(" ")).toContain("simpler day structure");
  });

  it("turns trend and correlation data into short patterns worth noticing", () => {
    const trends: TrendSummary[] = [
      { key: "fatigue", label: "Fatigue", averageCurrent: 4, direction: "down", summary: "Fatigue has felt a little heavier lately.", points: [] },
      { key: "mood", label: "Mood", averageCurrent: 3, direction: "flat", summary: "Mood has felt fairly steady lately.", points: [] },
    ];
    const correlations: CorrelationSummary[] = [
      {
        key: "fatigue-sleep",
        title: "Fatigue and sleep",
        leftLabel: "Fatigue",
        rightLabel: "Sleep",
        coefficient: -0.6,
        sampleSize: 8,
        show: true,
        summary: "On days with shorter sleep, fatigue often appears a little heavier.",
      },
    ];

    expect(deriveWhatChangedRecently(trends)).toEqual(["Fatigue has felt a little heavier lately."]);
    expect(derivePatternsWorthNoticing(correlations)).toEqual([
      "On days with shorter sleep, fatigue often appears a little heavier.",
    ]);
  });

  it("keeps small next steps practical and low pressure", () => {
    const entries = [
      buildEntry("2026-05-21", { fatigue: 5, stress: 4, sleep_hours: 5 }),
      buildEntry("2026-05-20", { fatigue: 4, stress: 4, sleep_hours: 5 }),
      buildEntry("2026-05-19", { fatigue: 5, stress: 5, sleep_hours: 6 }),
      buildEntry("2026-05-18", { fatigue: 4, stress: 4, sleep_hours: 6 }),
    ];

    const result = deriveSmallNextSteps(entries, ["A short reset may be enough today."]);
    expect(result.join(" ")).toContain("Keep tomorrow simpler");
    expect(result.join(" ")).not.toContain("You should");
  });

  it("filters fear-heavy and medicalized phrasing", () => {
    const sanitized = sanitizeInsightSafety(
      "A worsening pattern is a warning sign and you should see a doctor if your condition worsened.",
    );

    expect(sanitized).not.toContain("worsening");
    expect(sanitized).not.toContain("warning sign");
    expect(sanitized).not.toContain("you should see a doctor");
    expect(sanitized).toContain("worth noticing");
  });
});
