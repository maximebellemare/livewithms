import { describe, expect, it } from "vitest";
import { detectAdaptiveInstability } from "../../../lib/trust-observability/regression-detection/detectAdaptiveInstability";
import { detectToneRegression } from "../../../lib/trust-observability/regression-detection/detectToneRegression";

describe("trust observability regression detection", () => {
  it("detects tone regression", () => {
    const result = detectToneRegression(["This clearly confirms it. Stay strong."]);
    expect(result.drifted).toBe(true);
  });

  it("detects adaptive instability", () => {
    const result = detectAdaptiveInstability({
      activeSystems: ["a", "b", "c", "d", "e", "f", "g"],
      suppressedSignals: 3,
      emotionalSurfaceCount: 4,
    });

    expect(result.drifted).toBe(true);
  });
});
