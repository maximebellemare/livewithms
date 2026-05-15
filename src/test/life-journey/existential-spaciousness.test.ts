import { describe, expect, it } from "vitest";
import { deriveQuietReflectionSpaces } from "../../../lib/life-journey/existential-spaciousness/deriveQuietReflectionSpaces";
import { reduceInterpretiveOverload } from "../../../lib/life-journey/existential-spaciousness/reduceInterpretiveOverload";

describe("life journey existential spaciousness", () => {
  it("keeps long-view notes sparser during heavier states", () => {
    const result = deriveQuietReflectionSpaces({
      emotionalLoad: "high",
      reflectionCount: 4,
    });

    expect(result.maxNotes).toBe(1);
  });

  it("reduces interpretive overload by limiting line count", () => {
    const result = reduceInterpretiveOverload(["one", "two", "three"], 2);
    expect(result).toBe("one two");
  });
});
