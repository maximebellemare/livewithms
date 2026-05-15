import { describe, expect, it } from "vitest";
import { buildJourneySnapshot } from "../../../lib/journey-design/buildJourneySnapshot";
import { deriveEnduringPatterns } from "../../../lib/life-journey/identity-continuity/deriveEnduringPatterns";
import { preserveSelfContinuity } from "../../../lib/life-journey/identity-continuity/preserveSelfContinuity";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("life journey identity continuity", () => {
  it("softens illness-defining identity language", () => {
    expect(preserveSelfContinuity("MS defines you now, and your illness story is everything.").toLowerCase()).not.toMatch(
      /defines you now|illness story is everything/,
    );
  });

  it("surfaces enduring patterns without identity reduction", () => {
    const snapshot = buildJourneySnapshot([
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Quiet and breath helped." },
      { date: "2026-05-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Rest mattered." },
      { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Gentle pacing helped." },
      { date: "2026-05-01", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A walk helped." },
    ] satisfies LongitudinalEntry[]);

    const pattern = deriveEnduringPatterns(snapshot);
    expect(pattern?.toLowerCase()).toMatch(/grounding|pacing|steadier/);
  });
});
