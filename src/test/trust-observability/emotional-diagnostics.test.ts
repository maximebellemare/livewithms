import { describe, expect, it } from "vitest";
import { detectEmotionalRiskPatterns } from "../../../lib/trust-observability/emotional-diagnostics/detectEmotionalRiskPatterns";
import { detectRecursiveDistress } from "../../../lib/trust-observability/emotional-diagnostics/detectRecursiveDistress";

describe("trust observability emotional diagnostics", () => {
  it("detects recursive distress patterns", () => {
    const result = detectRecursiveDistress("Nothing is helping and everything feels harder.");
    expect(result.risk).toBe("elevated");
  });

  it("detects emotional risk stacking", () => {
    const result = detectEmotionalRiskPatterns({
      emotionalSurfaceCount: 4,
      adaptiveStatePrimary: "OVERWHELMED",
      recursiveDistressRisk: "guarded",
    });

    expect(result.risk).toBe("elevated");
  });
});
