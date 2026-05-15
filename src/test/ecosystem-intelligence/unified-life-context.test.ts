import { describe, expect, it } from "vitest";
import { deriveUnifiedSupportState } from "../../../lib/ecosystem-intelligence/unified-life-context/deriveUnifiedSupportState";
import { deriveCrossSystemContext } from "../../../lib/ecosystem-intelligence/unified-life-context/deriveCrossSystemContext";

describe("ecosystem intelligence unified life context", () => {
  it("gets quieter when burden is heavier", () => {
    const result = deriveUnifiedSupportState({
      adaptiveStatePrimary: "OVERWHELMED",
      fatigue: 4,
      stress: 4,
      brainFog: 4,
    });

    expect(result.recommendedMode).toBe("minimal");
    expect(result.maxActions).toBe(1);
  });

  it("summarizes cross-system context as one calm environment", () => {
    const result = deriveCrossSystemContext({
      learningActive: true,
      cognitionActive: true,
      audioActive: true,
      ambientActive: false,
      continuityActive: true,
      personalizationActive: true,
    });

    expect(result.activeSystems.length).toBeGreaterThan(3);
    expect(result.summary.toLowerCase()).toContain("coordination");
  });
});
