import { describe, expect, it } from "vitest";
import { deriveAudioFirstMode } from "../../../lib/audio-ecosystem/screen-fatigue-reduction/deriveAudioFirstMode";
import { deriveLowVisualLoad } from "../../../lib/audio-ecosystem/screen-fatigue-reduction/deriveLowVisualLoad";

describe("audio ecosystem screen fatigue reduction", () => {
  it("enables audio-first support for heavier screen fatigue states", () => {
    const result = deriveAudioFirstMode({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "high",
      brainFog: 4,
    });

    expect(result.enabled).toBe(true);
  });

  it("reduces visual load when attention is strained", () => {
    const result = deriveLowVisualLoad("high");

    expect(result.reduceDensity).toBe(true);
    expect(result.summary.toLowerCase()).toContain("visual");
  });
});
