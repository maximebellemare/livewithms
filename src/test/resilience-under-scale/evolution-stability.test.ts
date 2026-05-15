import { describe, expect, it } from "vitest";
import { validateScaleResilience } from "../../../lib/resilience-under-scale/evolution-stability/validateScaleResilience";
import { validateAdaptiveDurability } from "../../../lib/resilience-under-scale/evolution-stability/validateAdaptiveDurability";

describe("resilience under scale evolution stability", () => {
  it("fails scale resilience when inflation and drift stack together", () => {
    const result = validateScaleResilience({
      conflictRisk: "guarded",
      overloadRisk: "elevated",
      adaptationInflation: true,
      philosophyDrifted: false,
    });

    expect(result.valid).toBe(false);
    expect(result.risk).not.toBe("low");
  });

  it("requests compression when orchestration durability weakens", () => {
    const result = validateAdaptiveDurability({
      instabilityDetected: true,
      duplicationCount: 1,
      redundancyCount: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.shouldCompress).toBe(true);
  });
});
