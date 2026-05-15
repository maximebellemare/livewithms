import { describe, expect, it } from "vitest";
import { deriveUpgradeTiming } from "../../../lib/premium-ecosystem/low-pressure-upgrades/deriveUpgradeTiming";
import { preventConversionPressure } from "../../../lib/premium-ecosystem/low-pressure-upgrades/preventConversionPressure";

describe("premium ecosystem low-pressure upgrades", () => {
  it("defers upgrade pressure when loading or failing", () => {
    expect(
      deriveUpgradeTiming({
        source: "premium-screen",
        isLoading: true,
        hasRecentFailure: false,
      }),
    ).toBe("defer");
  });

  it("removes conversion-pressure phrasing", () => {
    const result = preventConversionPressure("Unlock now and act now.");

    expect(result.toLowerCase()).not.toContain("unlock now");
    expect(result.toLowerCase()).not.toContain("act now");
  });
});
