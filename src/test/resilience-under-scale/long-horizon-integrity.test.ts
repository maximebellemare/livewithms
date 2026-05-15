import { describe, expect, it } from "vitest";
import { detectLongTermPhilosophyDrift } from "../../../lib/resilience-under-scale/long-horizon-integrity/detectLongTermPhilosophyDrift";
import { validateLongTermRestraint } from "../../../lib/resilience-under-scale/long-horizon-integrity/validateLongTermRestraint";

describe("resilience under scale long horizon integrity", () => {
  it("detects long-term drift when manipulation or authority pressure rises", () => {
    const result = detectLongTermPhilosophyDrift({
      calmnessRegression: false,
      manipulationRisk: true,
      authorityDrift: false,
    });

    expect(result.drifted).toBe(true);
    expect(result.severity).toBe("elevated");
  });

  it("tightens restraint when interpretation and inflation drift upward", () => {
    const result = validateLongTermRestraint({
      philosophyDrifted: false,
      adaptationInflated: true,
      overInterpretation: true,
    });

    expect(result.valid).toBe(false);
    expect(result.shouldQuietFurther).toBe(true);
  });
});
