import { describe, expect, it } from "vitest";
import { buildJourneySnapshot } from "../../../lib/journey-design/buildJourneySnapshot";
import { deriveNonIllnessMeaning } from "../../../lib/life-journey/beyond-ms-preservation/deriveNonIllnessMeaning";
import { preserveOrdinaryLifeIdentity } from "../../../lib/life-journey/beyond-ms-preservation/preserveOrdinaryLifeIdentity";
import type { LongitudinalEntry } from "../../../lib/longitudinal/types";

describe("life journey beyond ms preservation", () => {
  it("preserves ordinary-life identity language", () => {
    expect(preserveOrdinaryLifeIdentity("Symptoms are your whole story now.").toLowerCase()).not.toContain("whole story");
  });

  it("keeps meaning available outside illness framing", () => {
    const snapshot = buildJourneySnapshot([
      { date: "2026-05-15", fatigue: 3, stress: 2, brain_fog: 2, mood: 3, sleep_hours: 7, water_glasses: 6, notes: "Reading and music helped." },
      { date: "2026-05-10", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Cooked with family." },
      { date: "2026-05-05", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "A quiet walk helped." },
      { date: "2026-05-01", fatigue: 3, stress: 3, brain_fog: 2, mood: 3, sleep_hours: 6, water_glasses: 5, notes: "Needed rest." },
    ] satisfies LongitudinalEntry[]);

    expect(deriveNonIllnessMeaning(snapshot)?.toLowerCase()).toContain("ordinary");
  });
});
