import { describe, expect, it } from "vitest";
import { deriveAccessibilityPrograms } from "../../../lib/premium-ecosystem/financial-accessibility/deriveAccessibilityPrograms";
import { deriveRegionalSensitivity } from "../../../lib/premium-ecosystem/financial-accessibility/deriveRegionalSensitivity";

describe("premium ecosystem financial accessibility", () => {
  it("keeps accessibility language shame-free", () => {
    const result = deriveAccessibilityPrograms();

    expect(result.toLowerCase()).toContain("accessibility");
    expect(result.toLowerCase()).not.toContain("prove hardship");
  });

  it("recognizes regional sensitivity", () => {
    const result = deriveRegionalSensitivity();

    expect(result.toLowerCase()).toContain("different contexts");
  });
});
