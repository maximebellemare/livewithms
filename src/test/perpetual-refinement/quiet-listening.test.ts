import { describe, expect, it } from "vitest";
import { deriveHumaneObservation } from "../../../lib/perpetual-refinement/quiet-listening/deriveHumaneObservation";
import { preventReactiveOptimization } from "../../../lib/perpetual-refinement/quiet-listening/preventReactiveOptimization";

describe("perpetual refinement quiet listening", () => {
  it("derives humane observation guidance", () => {
    expect(deriveHumaneObservation().length).toBeGreaterThan(0);
  });

  it("prevents reactive optimization language", () => {
    expect(preventReactiveOptimization("We should optimize every interaction and iterate aggressively.").toLowerCase()).not.toMatch(
      /optimize every interaction|iterate aggressively/,
    );
  });
});
