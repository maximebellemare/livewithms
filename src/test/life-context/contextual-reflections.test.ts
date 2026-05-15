import { describe, expect, it } from "vitest";
import { buildLifeContextSnapshot } from "../../../lib/life-context/buildLifeContextSnapshot";
import { injectContextualAwareness } from "../../../lib/life-context/contextual-reflections/injectContextualAwareness";
import { softenInterpretationWithContext } from "../../../lib/life-context/contextual-reflections/softenInterpretationWithContext";
import type { LongitudinalObservation, LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  { date: "2026-05-15", fatigue: 4, stress: 4, brain_fog: 4, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "Travel week" },
  { date: "2026-05-14", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 5, notes: null },
  { date: "2026-05-13", fatigue: 3, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 5, notes: null },
];

describe("life-context contextual reflections", () => {
  it("softens interpretation with probabilistic context", () => {
    const context = buildLifeContextSnapshot(entries);
    const text = softenInterpretationWithContext("Stress caused your fatigue to worsen.", context);
    expect(text.toLowerCase()).not.toContain("caused");
    expect(text.toLowerCase()).toContain("may be connected");
  });

  it("injects contextual awareness without replacing the whole observation set", () => {
    const observations: LongitudinalObservation[] = [
      {
        id: "trend-weekly-fatigue",
        title: "fatigue pattern",
        body: "Some recent entries suggest fatigue has felt a little heavier in this period.",
        windowKey: "weekly",
        relatedMetrics: ["fatigue"],
        confidence: "light",
        source: "trend",
      },
    ];

    const result = injectContextualAwareness(observations, buildLifeContextSnapshot(entries));
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].title).toBe("Life context");
  });
});

