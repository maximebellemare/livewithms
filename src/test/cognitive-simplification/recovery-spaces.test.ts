import { describe, expect, it } from "vitest";
import { deriveQuietMoments } from "../../../lib/cognitive-simplification/recovery-spaces/deriveQuietMoments";
import { deriveLowStimulusSurface } from "../../../lib/cognitive-simplification/recovery-spaces/deriveLowStimulusSurface";
import { deriveAdaptiveDefaults } from "../../../lib/cognitive-simplification/calm-defaults/deriveAdaptiveDefaults";

describe("cognitive simplification recovery spaces", () => {
  it("creates a quiet moment when emotional surfaces are stacked", () => {
    const quiet = deriveQuietMoments({
      adaptiveStatePrimary: "OVERWHELMED",
      hasStackedEmotionalSurfaces: true,
    });

    expect(quiet).not.toBeNull();
    expect(quiet?.body.toLowerCase()).toContain("one small step");
  });

  it("derives low-stimulus defaults during high burden", () => {
    const surface = deriveLowStimulusSurface("LOW_ENERGY");
    const defaults = deriveAdaptiveDefaults({
      burden: "high",
      disclosureDepth: "minimal",
    });

    expect(surface).not.toBeNull();
    expect(defaults.noteStarterCount).toBe(1);
    expect(defaults.quickLinkCount).toBe(2);
  });
});
