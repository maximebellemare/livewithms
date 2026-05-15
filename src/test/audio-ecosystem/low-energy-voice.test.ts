import { describe, expect, it } from "vitest";
import { deriveLowEffortInteraction } from "../../../lib/audio-ecosystem/low-energy-voice/deriveLowEffortInteraction";
import { deriveVoiceCheckins } from "../../../lib/audio-ecosystem/low-energy-voice/deriveVoiceCheckins";

describe("audio ecosystem low-energy voice", () => {
  it("keeps voice check-ins bounded", () => {
    const result = deriveVoiceCheckins("LOW_ENERGY");

    expect(result.toLowerCase()).toContain("simple");
    expect(result.toLowerCase()).not.toContain("conversation");
  });

  it("supports lower-effort interaction under higher load", () => {
    const result = deriveLowEffortInteraction("high");

    expect(result.toLowerCase()).toContain("fewer taps");
    expect(result.toLowerCase()).not.toContain("keep going");
  });
});
