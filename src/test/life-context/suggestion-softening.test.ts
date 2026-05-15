import { describe, expect, it } from "vitest";
import { buildLifeContextSnapshot } from "../../../lib/life-context/buildLifeContextSnapshot";
import { deriveGentleSuggestion } from "../../../lib/life-context/suggestion-softening/deriveGentleSuggestion";
import { deriveReducedDemandSuggestion } from "../../../lib/life-context/suggestion-softening/deriveReducedDemandSuggestion";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("life-context suggestion softening", () => {
  it("keeps suggestions gentle during heavier stretches", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 4, stress: 4, brain_fog: 4, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "Busy week" },
      { date: "2026-05-14", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 5, notes: null },
      { date: "2026-05-13", fatigue: 4, stress: 4, brain_fog: 3, mood: 3, sleep_hours: 5, water_glasses: 5, notes: null },
    ];

    const suggestion = deriveGentleSuggestion(buildLifeContextSnapshot(entries));
    expect(suggestion?.body.toLowerCase()).toContain("gentler");
  });

  it("supports reduced-demand suggestions for disrupted periods", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Trip away" },
      { date: "2026-05-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: null },
      { date: "2026-05-08", fatigue: 2, stress: 2, brain_fog: 2, mood: 4, sleep_hours: 7, water_glasses: 6, notes: null },
    ];

    const suggestion = deriveReducedDemandSuggestion(buildLifeContextSnapshot(entries));
    expect(suggestion?.body.toLowerCase()).toContain("brief");
  });
});
