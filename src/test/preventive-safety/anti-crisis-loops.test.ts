import { describe, expect, it } from "vitest";
import { preventRecursiveDistress } from "../../../lib/preventive-safety/anti-crisis-loops/preventRecursiveDistress";
import { reduceOverAnalysis } from "../../../lib/preventive-safety/anti-crisis-loops/reduceOverAnalysis";

describe("preventive safety anti crisis loops", () => {
  it("interrupts recursive distress phrasing", () => {
    expect(preventRecursiveDistress("Keep unpacking it and stay with this feeling.").toLowerCase()).not.toMatch(/keep unpacking|stay with this feeling/);
  });

  it("reduces over-analysis framing", () => {
    expect(reduceOverAnalysis("Figure it all out and understand this completely.").toLowerCase()).not.toMatch(/figure it all out|understand this completely/);
  });
});
