import { describe, expect, it } from "vitest";
import { deriveDisclosureDepth } from "../../../lib/cognitive-simplification/progressive-disclosure/deriveDisclosureDepth";
import { deriveOptionalExpansion } from "../../../lib/cognitive-simplification/progressive-disclosure/deriveOptionalExpansion";

describe("cognitive simplification disclosure", () => {
  it("reduces disclosure depth during overwhelmed states", () => {
    const depth = deriveDisclosureDepth({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      lifecycleStage: "active",
    });

    expect(depth).toBe("minimal");
    expect(deriveOptionalExpansion(depth).showBestWorstDay).toBe(false);
  });

  it("allows richer optional depth for reflective long-term use", () => {
    const depth = deriveDisclosureDepth({
      adaptiveStatePrimary: "REFLECTIVE",
      burden: "low",
      lifecycleStage: "long-term",
    });

    expect(depth).toBe("expanded");
  });
});
