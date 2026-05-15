import { describe, expect, it } from "vitest";
import { deriveUnifiedTone } from "../../../lib/system-coherence/tone-harmonization/deriveUnifiedTone";
import { validateCrossSurfaceTone } from "../../../lib/system-coherence/tone-harmonization/validateCrossSurfaceTone";

describe("system coherence tone harmonization", () => {
  it("derives grounded tone for high load", () => {
    expect(
      deriveUnifiedTone({
        adaptiveStatePrimary: "OVERWHELMED",
        emotionalLoad: "high",
      }),
    ).toBe("grounded");
  });

  it("flags too many competing tones", () => {
    const result = validateCrossSurfaceTone(["quiet", "grounded", "reflective"]);
    expect(result.consistent).toBe(false);
  });
});
