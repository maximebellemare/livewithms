import { describe, expect, it } from "vitest";
import { deriveUserRightsFramework } from "../../../lib/product-constitution/calmness-rights/deriveUserRightsFramework";
import { validateAutonomyProtection } from "../../../lib/product-constitution/calmness-rights/validateAutonomyProtection";

describe("product constitution calmness rights", () => {
  it("defines a rights framework", () => {
    const rights = deriveUserRightsFramework();

    expect(rights).toContain("right-to-disengage-safely");
    expect(rights).toContain("right-to-non-surveillance");
  });

  it("flags missing autonomy rights protections", () => {
    const result = validateAutonomyProtection({
      hasSafeDisengagement: false,
      hasUncertaintyProtection: true,
      hasNonSurveillanceBoundary: false,
    });

    expect(result.valid).toBe(false);
    expect(result.missing).toContain("right-to-disengage-safely");
    expect(result.missing).toContain("right-to-non-surveillance");
  });
});
