import { describe, expect, it } from "vitest";
import { deriveExpansionConstraints } from "../../../lib/sustainability-architecture/expansion-boundaries/deriveExpansionConstraints";
import { validateSystemBoundaries } from "../../../lib/sustainability-architecture/expansion-boundaries/validateSystemBoundaries";

describe("sustainability architecture expansion boundaries", () => {
  it("derives stable expansion constraints", () => {
    const constraints = deriveExpansionConstraints(["ai-surface", "wearable"]);
    expect(constraints.length).toBe(2);
    expect(constraints[1].requiresConsentBoundary).toBe(true);
  });

  it("flags boundary overflow", () => {
    const result = validateSystemBoundaries({
      constraints: deriveExpansionConstraints(["ai-surface"]),
      requestedTouchpoints: 5,
    });

    expect(result.valid).toBe(false);
  });
});
