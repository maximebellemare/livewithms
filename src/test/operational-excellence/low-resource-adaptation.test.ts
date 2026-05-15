import { describe, expect, it } from "vitest";
import { deriveBatteryAwareBehavior } from "../../../lib/operational-excellence/low-resource-adaptation/deriveBatteryAwareBehavior";
import { deriveLowResourceSimplification } from "../../../lib/operational-excellence/low-resource-adaptation/deriveLowResourceSimplification";

describe("operational excellence low-resource adaptation", () => {
  it("reduces intensity when resources are constrained", () => {
    const result = deriveBatteryAwareBehavior({
      batteryState: "low",
      resourcePressure: "constrained",
    });

    expect(result.reduceBackgroundActivity).toBe(true);
    expect(result.preferSimplerSurfaces).toBe(true);
  });

  it("returns calmer simplification guidance", () => {
    const result = deriveLowResourceSimplification({
      resourcePressure: "constrained",
    });

    expect(result.toLowerCase()).toContain("lighter interaction");
  });
});
