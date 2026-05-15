import { describe, expect, it } from "vitest";
import { deriveDeviceAccessibilityModes } from "../../../lib/cross-platform-continuity/device-accessibility/deriveDeviceAccessibilityModes";
import { deriveLowEnergySurfaceSupport } from "../../../lib/cross-platform-continuity/device-accessibility/deriveLowEnergySurfaceSupport";

describe("cross-platform continuity device accessibility", () => {
  it("keeps watch surfaces glanceable", () => {
    const result = deriveDeviceAccessibilityModes("watch");

    expect(result.preferGlanceable).toBe(true);
  });

  it("supports lower-energy surfaces gently", () => {
    const result = deriveLowEnergySurfaceSupport({
      reduceVisualLoad: true,
      preferGlanceable: false,
    });

    expect(result.toLowerCase()).toContain("lower-load");
  });
});
