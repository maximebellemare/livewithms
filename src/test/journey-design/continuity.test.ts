import { describe, expect, it } from "vitest";
import { deriveContinuitySignals } from "../../../lib/journey-design/continuity-preservation/deriveContinuitySignals";
import { resurfaceGroundingPatterns } from "../../../lib/journey-design/continuity-preservation/resurfaceGroundingPatterns";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("journey continuity preservation", () => {
  it("preserves continuity without guilt after gaps", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Back again, keeping it gentle." },
      { date: "2026-05-09", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: null },
      { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Rest helped." },
    ];

    const signals = deriveContinuitySignals(entries);
    expect(signals.some((signal) => signal.body.toLowerCase().includes("return"))).toBe(true);
    expect(signals.some((signal) => signal.body.toLowerCase().includes("missed"))).toBe(false);
  });

  it("resurfaces grounding patterns sparsely", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Quiet and breath helped." },
      { date: "2026-05-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A walk and water helped." },
      { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Rest helped." },
      { date: "2026-05-01", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: null },
    ];

    const resurfaced = resurfaceGroundingPatterns(entries);
    expect(resurfaced.length).toBeLessThanOrEqual(1);
  });
});

