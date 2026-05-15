import { describe, expect, it } from "vitest";
import { deriveRecoveryCycles } from "../../../lib/journey-design/long-term-rhythms/deriveRecoveryCycles";
import { deriveSeasonalRhythms } from "../../../lib/journey-design/long-term-rhythms/deriveSeasonalRhythms";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("journey long-term rhythms", () => {
  it("derives seasonal rhythms without optimization framing", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-12-10", fatigue: 4, stress: 3, brain_fog: 3, mood: 2, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-12-01", fatigue: 4, stress: 3, brain_fog: 3, mood: 2, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-11-20", fatigue: 4, stress: 3, brain_fog: 3, mood: 2, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-08-20", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-08-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-08-01", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-04-01", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-03-20", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-03-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-06-20", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-06-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-06-01", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: null },
    ];

    const rhythms = deriveSeasonalRhythms(entries);
    expect(rhythms.length).toBeGreaterThan(0);
    expect(rhythms[0].body.toLowerCase()).not.toContain("optimiz");
  });

  it("derives recovery cycles gently", () => {
    const entries: LongitudinalEntry[] = Array.from({ length: 8 }, (_, index) => ({
      date: `2026-05-${String(15 - index).padStart(2, "0")}`,
      fatigue: 4,
      stress: 4,
      brain_fog: 3,
      mood: 2,
      sleep_hours: 5,
      water_glasses: 4,
      notes: null,
    }));

    const cycles = deriveRecoveryCycles(entries);
    expect(cycles[0].body.toLowerCase()).toContain("recovery");
  });
});

