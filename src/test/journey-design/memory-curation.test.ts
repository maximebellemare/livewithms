import { describe, expect, it } from "vitest";
import { deriveMemoryResurfacing } from "../../../lib/journey-design/memory-curation/deriveMemoryResurfacing";
import { selectMeaningfulReflections } from "../../../lib/journey-design/memory-curation/selectMeaningfulReflections";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("journey memory curation", () => {
  it("selects meaningful reflections sparingly", () => {
    const entries: LongitudinalEntry[] = [
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A gentle pace helped me feel steadier today." },
      { date: "2026-05-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Quiet and rest mattered more than pushing." },
      { date: "2026-04-10", fatigue: 4, stress: 4, brain_fog: 3, mood: 2, sleep_hours: 5, water_glasses: 4, notes: "I came back to this after a harder stretch and kept it simple." },
      { date: "2026-03-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Kindness mattered more than getting everything done." },
    ];

    const selected = selectMeaningfulReflections(entries);
    expect(selected.length).toBeLessThanOrEqual(3);
  });

  it("resurfaces older grounding reflections infrequently", () => {
    const resurfacing = deriveMemoryResurfacing(
      [
        {
          date: "2026-04-01",
          text: "Quiet and pacing helped me feel more steady.",
          reason: "grounding",
        },
      ],
      new Date("2026-05-15T12:00:00"),
    );

    expect(resurfacing?.shouldResurface).toBe(true);
    expect(resurfacing?.body?.toLowerCase()).not.toContain("look how far");
  });
});

