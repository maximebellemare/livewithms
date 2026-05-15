import { describe, expect, it } from "vitest";
import { buildJourneySnapshot } from "../../../lib/journey-design/buildJourneySnapshot";
import { deriveLongTermPerspective } from "../../../lib/life-journey/reflection-seasons/deriveLongTermPerspective";
import { deriveSeasonalReflections } from "../../../lib/life-journey/reflection-seasons/deriveSeasonalReflections";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

const entries: LongitudinalEntry[] = [
  { date: "2026-05-15", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "Needed more rest and a gentler pace." },
  { date: "2026-05-10", fatigue: 4, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 5, water_glasses: 5, notes: "A quieter day helped." },
  { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Walked and rested." },
  { date: "2026-04-28", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "Came back after a harder stretch." },
  { date: "2026-04-20", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Cooking helped me feel ordinary again." },
  { date: "2026-04-12", fatigue: 4, stress: 3, brain_fog: 3, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Needed a slower pace." },
];

describe("life journey reflection seasons", () => {
  it("keeps seasonal reflections free of transformation framing", () => {
    const snapshot = buildJourneySnapshot(entries);
    const note = deriveSeasonalReflections(snapshot);

    expect(note?.body.toLowerCase()).not.toContain("transformation");
    expect(note?.body.toLowerCase()).not.toContain("journey");
  });

  it("preserves a nonlinear long-term perspective", () => {
    const snapshot = buildJourneySnapshot(entries);
    const perspective = deriveLongTermPerspective(snapshot);

    expect(perspective?.toLowerCase()).toMatch(/different|continuity|seasons/);
    expect(perspective?.toLowerCase()).not.toContain("healing journey");
  });
});
