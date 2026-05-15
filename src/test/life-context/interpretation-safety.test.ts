import { describe, expect, it } from "vitest";
import { preventCausalOverreach } from "../../../lib/life-context/interpretation-safety/preventCausalOverreach";
import { reduceInterpretationCertainty } from "../../../lib/life-context/interpretation-safety/reduceInterpretationCertainty";

describe("life-context interpretation safety", () => {
  it("prevents causal overreach", () => {
    expect(preventCausalOverreach("Stress caused your fatigue.").toLowerCase()).not.toContain("caused");
  });

  it("reduces certainty language", () => {
    const result = reduceInterpretationCertainty("This clearly shows your recovery is slower.");
    expect(result.toLowerCase()).not.toContain("clearly");
    expect(result.toLowerCase()).toContain("may be");
  });
});

