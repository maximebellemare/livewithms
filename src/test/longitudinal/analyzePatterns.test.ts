import { describe, expect, it } from "vitest";
import { analyzePatterns } from "../../../lib/longitudinal/pattern-engine/analyzePatterns";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  {
    date: "2026-05-14",
    fatigue: 5,
    stress: 4,
    brain_fog: 4,
    mood: 2,
    sleep_hours: 5,
    water_glasses: 4,
    notes: "Overwhelmed and tired, but breathing helped a little.",
    interaction_count: 1,
    hour_of_day: 19,
  },
  {
    date: "2026-05-13",
    fatigue: 4,
    stress: 4,
    brain_fog: 3,
    mood: 2,
    sleep_hours: 5.5,
    water_glasses: 5,
    notes: "Hard day. A gentler plan helped.",
    interaction_count: 1,
    hour_of_day: 18,
  },
  {
    date: "2026-05-12",
    fatigue: 3,
    stress: 3,
    brain_fog: 2,
    mood: 3,
    sleep_hours: 7.5,
    water_glasses: 7,
    notes: "Felt steadier in the evening.",
    interaction_count: 2,
    hour_of_day: 20,
  },
  {
    date: "2026-05-11",
    fatigue: 2,
    stress: 2,
    brain_fog: 1,
    mood: 4,
    sleep_hours: 8,
    water_glasses: 7,
    notes: null,
    interaction_count: 1,
    hour_of_day: 9,
  },
];

describe("analyzePatterns", () => {
  it("builds windows, observations, and emotional context without medicalized language", () => {
    const analysis = analyzePatterns(entries);

    expect(analysis.windows.length).toBe(3);
    expect(analysis.trendSummaries.length).toBeGreaterThan(0);
    expect(analysis.emotionalContext.summary.length).toBeGreaterThan(0);
    expect(analysis.observations.length).toBeGreaterThan(0);
    expect(analysis.observations.some((observation) => /progression|clinically significant|declining/i.test(observation.body))).toBe(false);
  });

  it("handles empty users safely", () => {
    const analysis = analyzePatterns([]);
    expect(analysis.windows[0].daysLogged).toBe(0);
    expect(analysis.observations).toEqual([]);
    expect(analysis.correlations).toEqual([]);
  });
});
