import { describe, expect, it } from "vitest";
import { deriveVariabilityContext } from "../../../lib/uncertainty-safety/variability-normalization/deriveVariabilityContext";
import { generateNormalizationLanguage } from "../../../lib/uncertainty-safety/variability-normalization/generateNormalizationLanguage";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("uncertainty safety variability normalization", () => {
  it("normalizes variability for more changeable stretches", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 5, stress: 4, brain_fog: 4, mood: 2, sleep_hours: 5, water_glasses: 4, notes: null },
      { date: "2026-05-14", fatigue: 2, stress: 2, brain_fog: 1, mood: 4, sleep_hours: 7, water_glasses: 6, notes: null },
      { date: "2026-05-13", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: null },
      { date: "2026-05-12", fatigue: 2, stress: 2, brain_fog: 1, mood: 4, sleep_hours: 7, water_glasses: 6, notes: null },
    ];

    const context = deriveVariabilityContext(entries);
    expect(context.level).not.toBe("low");
    expect(generateNormalizationLanguage(context).toLowerCase()).toContain("variable");
  });
});

