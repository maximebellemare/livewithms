import { describe, expect, it } from "vitest";
import { deriveCollectiveThemes } from "../../../lib/human-connection/ambient-belonging/deriveCollectiveThemes";
import { generateSeasonalResonance } from "../../../lib/human-connection/ambient-belonging/generateSeasonalResonance";
import { deriveSharedThemes } from "../../../lib/human-connection/quiet-reflections/deriveSharedThemes";
import { generateAmbientConnection } from "../../../lib/human-connection/quiet-reflections/generateAmbientConnection";

describe("human connection ambient belonging", () => {
  it("creates restrained shared themes", () => {
    const shared = deriveSharedThemes(
      deriveCollectiveThemes({
        stressTrend: "elevated",
        sleepTrend: "low",
        reflectionPattern: "active",
        lowEnergyMode: true,
      }),
    );

    expect(shared.length).toBeGreaterThan(0);
    expect(shared.length).toBeLessThanOrEqual(3);
  });

  it("generates a quiet shared note without feed mechanics", () => {
    const note = generateAmbientConnection([{ key: "pacing", label: "pacing", frequency: "common" }]);
    expect(note?.body.toLowerCase()).toContain("others");
    expect(note?.body.toLowerCase()).not.toContain("like");
  });

  it("supports seasonal resonance gently", () => {
    const resonance = generateSeasonalResonance("winter");
    expect(resonance?.body.toLowerCase()).toContain("often");
  });
});

