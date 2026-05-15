import { describe, expect, it } from "vitest";
import { deriveAccessibilityMetrics } from "../../../lib/ethical-insights/calm-analytics/deriveAccessibilityMetrics";
import { deriveCalmnessMetrics } from "../../../lib/ethical-insights/calm-analytics/deriveCalmnessMetrics";

describe("ethical insights calm analytics", () => {
  it("focuses calmness metrics on overload reduction rather than growth", () => {
    const result = deriveCalmnessMetrics().map((metric) => metric.purpose.toLowerCase()).join(" ");

    expect(result).toContain("overload");
    expect(result).not.toContain("maximize engagement");
  });

  it("keeps accessibility metrics centered on usability", () => {
    const result = deriveAccessibilityMetrics().map((metric) => metric.purpose.toLowerCase()).join(" ");

    expect(result).toContain("easier to use");
    expect(result).not.toContain("optimize your body");
  });
});
