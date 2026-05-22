import { describe, expect, it } from "vitest";
import {
  buildTrackClaritySnapshot,
  deriveCalmCorrelations,
  deriveFluctuationNote,
  deriveWhatChangedRecently,
} from "../../../features/track/clarity";
import type { DailyCheckIn } from "../../../features/checkins/types";

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

describe("track clarity", () => {
  it("surfaces calm recent-change observations", () => {
    const entries = [
      buildEntry("2026-05-21", { fatigue: 5, stress: 4 }),
      buildEntry("2026-05-20", { fatigue: 5, stress: 4 }),
      buildEntry("2026-05-19", { fatigue: 4, stress: 4 }),
      buildEntry("2026-05-18", { fatigue: 5, stress: 5 }),
      buildEntry("2026-05-17", { fatigue: 4, stress: 4 }),
      buildEntry("2026-05-16", { fatigue: 5, stress: 5 }),
      buildEntry("2026-05-15", { fatigue: 4, stress: 4 }),
      buildEntry("2026-05-14", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-13", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-12", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-11", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-10", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-09", { fatigue: 2, stress: 2 }),
      buildEntry("2026-05-08", { fatigue: 2, stress: 2 }),
    ];

    expect(deriveWhatChangedRecently(entries)).toContain("Fatigue has felt a little heavier recently.");
    expect(deriveWhatChangedRecently(entries)).toContain("Stress has felt a little heavier recently.");
  });

  it("uses plain-language correlations instead of technical coefficients", () => {
    const entries = [
      buildEntry("2026-05-21", { sleep_hours: 5, fatigue: 5 }),
      buildEntry("2026-05-20", { sleep_hours: 5, fatigue: 5 }),
      buildEntry("2026-05-19", { sleep_hours: 6, fatigue: 4 }),
      buildEntry("2026-05-18", { sleep_hours: 6, fatigue: 4 }),
      buildEntry("2026-05-17", { sleep_hours: 7, fatigue: 3 }),
      buildEntry("2026-05-16", { sleep_hours: 8, fatigue: 2 }),
      buildEntry("2026-05-15", { sleep_hours: 8, fatigue: 2 }),
    ];

    const correlations = deriveCalmCorrelations(entries);
    expect(correlations[0]).toContain("On days with shorter sleep, fatigue often appears a little heavier.");
    expect(correlations.join(" ")).not.toContain("0.");
  });

  it("adds a calm fluctuation note only when variation is noticeable", () => {
    const variedEntries = [
      buildEntry("2026-05-21", { fatigue: 5 }),
      buildEntry("2026-05-20", { fatigue: 2 }),
      buildEntry("2026-05-19", { fatigue: 4 }),
      buildEntry("2026-05-18", { fatigue: 1 }),
      buildEntry("2026-05-17", { fatigue: 5 }),
    ];

    expect(deriveFluctuationNote(variedEntries)).toContain("one difficult day does not define the whole pattern");
    expect(deriveFluctuationNote([buildEntry("2026-05-21"), buildEntry("2026-05-20")])).toBeNull();
  });

  it("builds a compact weekly and monthly snapshot", () => {
    const entries = Array.from({ length: 14 }, (_, index) =>
      buildEntry(`2026-05-${String(21 - index).padStart(2, "0")}`, {
        fatigue: index < 7 ? 4 : 3,
        mood: 3,
        stress: 3,
        sleep_hours: 7,
      }),
    );

    const snapshot = buildTrackClaritySnapshot(entries);
    expect(snapshot.weeklySummary?.title).toBe("This week at a glance");
    expect(snapshot.weeklySummary?.metrics.length).toBeGreaterThan(3);
    expect(snapshot.monthlySummary).not.toBeNull();
  });
});
