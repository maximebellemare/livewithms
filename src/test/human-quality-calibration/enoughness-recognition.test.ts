import { describe, expect, it } from "vitest";
import { detectOverRefinement } from "../../../lib/human-quality-calibration/enoughness-recognition/detectOverRefinement";
import { preserveHumaneSimplicity } from "../../../lib/human-quality-calibration/enoughness-recognition/preserveHumaneSimplicity";

describe("human quality calibration enoughness recognition", () => {
  it("detects over-refinement", () => {
    expect(
      detectOverRefinement({
        microcopyLayers: 5,
        guardrailNotes: 3,
        refinementPasses: 4,
      }).overRefined,
    ).toBe(true);
  });

  it("preserves humane simplicity", () => {
    expect(preserveHumaneSimplicity("This is beautifully optimized and perfectly tailored.").toLowerCase()).not.toMatch(
      /beautifully optimized|perfectly tailored/,
    );
  });
});
