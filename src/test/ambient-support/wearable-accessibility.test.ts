import { describe, expect, it } from "vitest";
import { deriveWatchInteractions } from "../../../lib/ambient-support/wearable-accessibility/deriveWatchInteractions";
import { deriveLowEnergyWearableFlows } from "../../../lib/ambient-support/wearable-accessibility/deriveLowEnergyWearableFlows";

describe("ambient support wearable accessibility", () => {
  it("keeps watch interactions brief in low-energy states", () => {
    const result = deriveWatchInteractions({
      lowEnergy: true,
    });

    expect(result.toLowerCase()).toContain("quick");
    expect(result.toLowerCase()).not.toContain("constant");
  });

  it("keeps low-energy wearable flows easy to dismiss", () => {
    const result = deriveLowEnergyWearableFlows({
      lowEnergy: true,
      quieterDay: true,
    });

    expect(result.toLowerCase()).toContain("easy to dismiss");
  });
});
