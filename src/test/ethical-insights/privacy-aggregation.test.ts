import { describe, expect, it } from "vitest";
import { deriveAggregationThresholds } from "../../../lib/ethical-insights/privacy-aggregation/deriveAggregationThresholds";
import { preventReidentification } from "../../../lib/ethical-insights/privacy-aggregation/preventReidentification";

describe("ethical insights privacy aggregation", () => {
  it("uses coarse thresholds", () => {
    const result = deriveAggregationThresholds();

    expect(result.minimumCohortSize).toBeGreaterThanOrEqual(20);
    expect(result.precision).toBe("coarse");
    expect(result.retainFreeText).toBe(false);
  });

  it("removes reidentifying phrasing", () => {
    const result = preventReidentification("This exact pattern came from a specific person.");

    expect(result.toLowerCase()).not.toContain("exact pattern");
    expect(result.toLowerCase()).not.toContain("specific person");
  });
});
