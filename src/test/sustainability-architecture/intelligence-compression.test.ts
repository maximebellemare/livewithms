import { describe, expect, it } from "vitest";
import { reduceLogicFragmentation } from "../../../lib/sustainability-architecture/intelligence-compression/reduceLogicFragmentation";
import { unifyAdaptivePrimitives } from "../../../lib/sustainability-architecture/intelligence-compression/unifyAdaptivePrimitives";

describe("sustainability architecture intelligence compression", () => {
  it("unifies adaptive primitives into a stable key", () => {
    const primitive = unifyAdaptivePrimitives({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "moderate",
      adaptationIntensity: "minimal",
    });

    expect(primitive.key).toContain("LOW_ENERGY");
  });

  it("reduces logic fragmentation summary", () => {
    const result = reduceLogicFragmentation({
      primitives: ["a", "a", "b"],
      orchestrationLayers: ["meta", "meta", "coherence"],
    });

    expect(result.compressed).toBe(true);
    expect(result.primitiveCount).toBe(2);
  });
});
