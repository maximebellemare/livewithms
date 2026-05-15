import { describe, expect, it } from "vitest";
import { deriveAccessibilityModes } from "../../../lib/audio-ecosystem/accessibility-interactions/deriveAccessibilityModes";
import { deriveLowMobilitySupport } from "../../../lib/audio-ecosystem/accessibility-interactions/deriveLowMobilitySupport";

describe("audio ecosystem accessibility interactions", () => {
  it("enables lower-effort accessibility modes when needed", () => {
    const result = deriveAccessibilityModes({
      adaptiveStatePrimary: "LOW_ENERGY",
      attentionLoad: "high",
    });

    expect(result.lowEffort).toBe(true);
  });

  it("supports lower-mobility interaction without medicalizing it", () => {
    const result = deriveLowMobilitySupport({
      lowEffort: true,
    });

    expect(result.toLowerCase()).toContain("fewer gestures");
    expect(result.toLowerCase()).not.toContain("patient");
  });
});
