import { describe, expect, it } from "vitest";
import { preserveProductIdentity } from "../../../lib/product-constitution/identity-preservation/preserveProductIdentity";
import { detectTrendDrivenDrift } from "../../../lib/product-constitution/identity-preservation/detectTrendDrivenDrift";

describe("product constitution identity preservation", () => {
  it("preserves stable product identity under calm conditions", () => {
    const result = preserveProductIdentity({
      hasCalmTone: true,
      hasEmotionalRestraint: true,
      hasHumanCenteredAI: true,
    });

    expect(result.stable).toBe(true);
    expect(result.identity).toContain("human-centered");
  });

  it("detects trend-driven drift language", () => {
    const result = detectTrendDrivenDrift("Let's build a viral AI companion and optimize engagement.");

    expect(result.drifted).toBe(true);
    expect(result.severity).not.toBe("low");
  });
});
