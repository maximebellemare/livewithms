import { describe, expect, it } from "vitest";
import { deriveImmutablePrinciples } from "../../../lib/product-constitution/philosophy-invariants/deriveImmutablePrinciples";
import { validateInvariantIntegrity } from "../../../lib/product-constitution/philosophy-invariants/validateInvariantIntegrity";

describe("product constitution philosophy invariants", () => {
  it("defines immutable principles", () => {
    const principles = deriveImmutablePrinciples();

    expect(principles).toContain("autonomy-preservation");
    expect(principles).toContain("human-centered-ai");
  });

  it("flags missing invariant protections", () => {
    const result = validateInvariantIntegrity({
      activeSystems: ["ai-trust"],
      hasAutonomyProtection: false,
      hasAntiManipulationProtection: true,
      hasHumanCenteredAI: false,
    });

    expect(result.valid).toBe(false);
    expect(result.violations).toContain("autonomy-preservation");
    expect(result.violations).toContain("human-centered-ai");
  });
});
