import { describe, expect, it } from "vitest";
import { deriveContextAwareInteraction } from "../../../lib/cross-platform-continuity/adaptive-device-intelligence/deriveContextAwareInteraction";
import { deriveDeviceCapabilities } from "../../../lib/cross-platform-continuity/adaptive-device-intelligence/deriveDeviceCapabilities";

describe("cross-platform continuity adaptive device intelligence", () => {
  it("derives lighter capabilities for watch surfaces", () => {
    const result = deriveDeviceCapabilities("watch");

    expect(result.glanceable).toBe(true);
    expect(result.lowEnergyFriendly).toBe(true);
  });

  it("keeps device interaction capacity-aware", () => {
    const result = deriveContextAwareInteraction({
      adaptiveStatePrimary: "LOW_ENERGY",
      lowEnergyFriendly: true,
    });

    expect(result.toLowerCase()).toContain("lighter");
  });
});
