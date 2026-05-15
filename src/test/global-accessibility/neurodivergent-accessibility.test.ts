import { describe, expect, it } from "vitest";
import { deriveSensoryAccessibility } from "../../../lib/global-accessibility/neurodivergent-accessibility/deriveSensoryAccessibility";
import { deriveProcessingAccessibility } from "../../../lib/global-accessibility/neurodivergent-accessibility/deriveProcessingAccessibility";

describe("global accessibility neurodivergent accessibility", () => {
  it("reduces stimulation when sensory load is likely higher", () => {
    const result = deriveSensoryAccessibility({
      lowStimPreferred: true,
      sensorySensitive: true,
    });

    expect(result.reducedStimulus).toBe(true);
  });

  it("creates more processing room when complexity is lower", () => {
    const result = deriveProcessingAccessibility({
      lowerComplexity: true,
      lowEnergy: false,
    });

    expect(result.slowerPacing).toBe(true);
  });
});
