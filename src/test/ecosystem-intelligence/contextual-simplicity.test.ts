import { describe, expect, it } from "vitest";
import { deriveSimplificationMoments } from "../../../lib/ecosystem-intelligence/contextual-simplicity/deriveSimplificationMoments";
import { reduceSupportNoise } from "../../../lib/ecosystem-intelligence/contextual-simplicity/reduceSupportNoise";

describe("ecosystem intelligence contextual simplicity", () => {
  it("knows when simplification should lead", () => {
    const result = deriveSimplificationMoments({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      activeSystemCount: 5,
    });

    expect(result.shouldSimplify).toBe(true);
  });

  it("reduces support noise to a smaller set of lines", () => {
    expect(reduceSupportNoise(["one", "two", "three"], 2)).toBe("one two");
  });
});
