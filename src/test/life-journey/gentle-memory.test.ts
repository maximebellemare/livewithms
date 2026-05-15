import { describe, expect, it } from "vitest";
import { buildJourneySnapshot } from "../../../lib/journey-design/buildJourneySnapshot";
import { deriveGroundingMemoryResurfacing } from "../../../lib/life-journey/gentle-memory/deriveGroundingMemoryResurfacing";
import { preventEmotionalOvercuration } from "../../../lib/life-journey/gentle-memory/preventEmotionalOvercuration";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("life journey gentle memory", () => {
  it("prevents clingy memory framing", () => {
    expect(preventEmotionalOvercuration("Look how far you've come and never forget this feeling.").toLowerCase()).not.toMatch(
      /look how far|never forget/,
    );
  });

  it("resurfaces grounding memory lightly", () => {
    const snapshot = buildJourneySnapshot([
      { date: "2026-05-15", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Quiet helped." },
      { date: "2026-04-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A walk and pacing helped me feel steadier." },
      { date: "2026-03-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Rest mattered." },
      { date: "2026-02-10", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Kindness and quiet mattered." },
    ] satisfies LongitudinalEntry[]);

    expect(deriveGroundingMemoryResurfacing(snapshot)?.body.toLowerCase()).not.toContain("recreate it perfectly");
  });
});
