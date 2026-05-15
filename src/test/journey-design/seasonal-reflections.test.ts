import { describe, expect, it } from "vitest";
import { deriveLongWindowPatterns } from "../../../lib/journey-design/seasonal-reflections/deriveLongWindowPatterns";
import { deriveSeasonalSummary } from "../../../lib/journey-design/seasonal-reflections/deriveSeasonalSummary";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  { date: "2026-05-15", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "Needed more rest and a gentler pace" },
  { date: "2026-05-10", fatigue: 4, stress: 4, brain_fog: 3, mood: 3, sleep_hours: 5, water_glasses: 5, notes: "Returned after a harder week" },
  { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Quiet helped" },
  { date: "2026-04-28", fatigue: 4, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 6, notes: "Rest mattered again" },
  { date: "2026-04-20", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Gentle pacing" },
  { date: "2026-04-12", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "A slower stretch" },
  { date: "2026-04-04", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A steadier day returned" },
  { date: "2026-03-28", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Rest and quiet helped again" },
];

describe("journey seasonal reflections", () => {
  it("creates a safe seasonal summary without improvement framing", () => {
    const summary = deriveSeasonalSummary(entries);
    expect(summary?.body.toLowerCase()).not.toContain("improvement");
    expect(summary?.body.toLowerCase()).not.toContain("journey");
  });

  it("builds long-window patterns without transformation language", () => {
    const patterns = deriveLongWindowPatterns(entries);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].body.toLowerCase()).not.toContain("overcame");
  });
});
