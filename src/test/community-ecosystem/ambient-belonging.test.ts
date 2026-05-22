import { describe, expect, it } from "vitest";
import { deriveSharedHumanThemes } from "../../../lib/community-ecosystem/ambient-belonging/deriveSharedHumanThemes";
import { generateQuietResonance } from "../../../lib/community-ecosystem/ambient-belonging/generateQuietResonance";

describe("community ecosystem ambient belonging", () => {
  it("derives restrained shared human themes", () => {
    const themes = deriveSharedHumanThemes({
      lowPressureTopics: ["pacing through slower days", "rest and lower-energy stretches"],
      stressTrend: "elevated",
      sleepTrend: "low",
    });

    expect(themes.length).toBeLessThanOrEqual(3);
    expect(themes[0].toLowerCase()).toContain("gentler");
  });

  it("generates a quiet resonance note", () => {
    const note = generateQuietResonance(["needing gentler pacing"]);

    expect(note?.title).toBe("Shared theme");
    expect(note?.body.toLowerCase()).toContain("worth noticing");
    expect(note?.body.toLowerCase()).not.toContain("others");
  });
});
