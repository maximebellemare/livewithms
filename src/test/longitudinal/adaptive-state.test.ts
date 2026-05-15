import { describe, expect, it } from "vitest";
import { analyzePatterns } from "../../../lib/longitudinal/pattern-engine/analyzePatterns";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

const lowEnergyEntries: LongitudinalEntry[] = [
  {
    date: "2026-05-14",
    fatigue: 5,
    stress: 4,
    brain_fog: 4,
    mood: 2,
    sleep_hours: 5,
    water_glasses: 4,
    notes: "Hard to think clearly today.",
    interaction_count: 1,
  },
  {
    date: "2026-05-13",
    fatigue: 4,
    stress: 4,
    brain_fog: 4,
    mood: 2,
    sleep_hours: 5.5,
    water_glasses: 5,
    notes: "Very drained and foggy.",
    interaction_count: 1,
  },
  {
    date: "2026-05-12",
    fatigue: 4,
    stress: 3,
    brain_fog: 3,
    mood: 3,
    sleep_hours: 6,
    water_glasses: 5,
    notes: null,
    interaction_count: 0,
  },
];

describe("longitudinal adaptive state", () => {
  it("derives low-energy states for heavy fatigue and brain fog stretches", () => {
    const analysis = analyzePatterns(lowEnergyEntries);
    expect(analysis.adaptiveState.primary).toBe("LOW_ENERGY");
    expect(analysis.adaptiveState.reduceUiDensity).toBe(true);
    expect(analysis.adaptiveState.lowerNotificationPressure).toBe(true);
  });

  it("stays stable with sparse data", () => {
    const analysis = analyzePatterns([
      {
        date: "2026-05-14",
        fatigue: null,
        stress: null,
        brain_fog: null,
        mood: null,
        sleep_hours: null,
        water_glasses: null,
        notes: null,
      },
    ]);

    expect(analysis.adaptiveState.primary === "STABLE" || analysis.adaptiveState.primary === "WITHDRAWN").toBe(true);
    expect(analysis.observations.length).toBe(0);
  });
});
