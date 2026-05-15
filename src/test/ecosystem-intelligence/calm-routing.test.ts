import { describe, expect, it } from "vitest";
import { deriveSupportRouting } from "../../../lib/ecosystem-intelligence/calm-routing/deriveSupportRouting";
import { deriveContextualInteractionMode } from "../../../lib/ecosystem-intelligence/calm-routing/deriveContextualInteractionMode";

describe("ecosystem intelligence calm routing", () => {
  it("routes toward calmer contained support under stress", () => {
    const result = deriveSupportRouting({
      adaptiveStatePrimary: "OVERWHELMED",
      stress: 4,
      fatigue: 3,
    });

    expect(result.route).toBe("/coach");
  });

  it("uses quieter interaction modes for harder states", () => {
    expect(deriveContextualInteractionMode("LOW_ENERGY")).toBe("single-support-surface");
  });
});
