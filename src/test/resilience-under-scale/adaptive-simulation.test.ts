import { describe, expect, it } from "vitest";
import { simulateAdaptationConflicts } from "../../../lib/resilience-under-scale/adaptive-simulation/simulateAdaptationConflicts";
import { simulateEmotionalOverload } from "../../../lib/resilience-under-scale/adaptive-simulation/simulateEmotionalOverload";

describe("resilience under scale adaptive simulation", () => {
  it("flags elevated conflict risk when many adaptive systems stack together", () => {
    const result = simulateAdaptationConflicts({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
      activeSystems: [
        "ai-trust",
        "system-coherence",
        "ethical-governance",
        "meta-orchestration",
        "personalization",
        "uncertainty-safety",
      ],
      hasAiVisible: true,
    });

    expect(result.risk).toBe("elevated");
    expect(result.shouldSimplify).toBe(true);
  });

  it("flags emotional overload when reflective density is too high for the moment", () => {
    const result = simulateEmotionalOverload({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "moderate",
      reflectionCount: 4,
      hasAiVisible: true,
    });

    expect(result.risk).not.toBe("low");
    expect(result.shouldReduceEmotionalDensity).toBe(true);
  });
});
