import { describe, expect, it } from "vitest";
import { deriveEmotionalDensity } from "../../../lib/emotional-environment/emotional-pacing/deriveEmotionalDensity";
import { deriveReflectionSpacing } from "../../../lib/emotional-environment/emotional-pacing/deriveReflectionSpacing";

describe("emotional environment pacing", () => {
  it("keeps density sparse when emotional surfaces are stacking", () => {
    const density = deriveEmotionalDensity({
      atmosphere: "QUIET",
      hasStackedEmotionalSurfaces: true,
      reflectionCount: 2,
    });

    expect(density).toBe("SPARSE");
  });

  it("adds more breathing room in sparse mode", () => {
    const spacing = deriveReflectionSpacing("SPARSE");
    expect(spacing.gap).toBeGreaterThan(12);
  });
});

