import { describe, expect, it } from "vitest";
import { preventContinuityOverload } from "../../../lib/cross-platform-continuity/context-aware-reduction/preventContinuityOverload";
import { reduceCrossDevicePrompting } from "../../../lib/cross-platform-continuity/context-aware-reduction/reduceCrossDevicePrompting";

describe("cross-platform continuity context-aware reduction", () => {
  it("reduces cross-device prompting when prompts already exist", () => {
    const result = reduceCrossDevicePrompting({
      hasRecentPrompt: true,
      deviceCount: 2,
    });

    expect(result).toBe(true);
  });

  it("removes continuity-overload phrasing", () => {
    const result = preventContinuityOverload("Open this on every device and keep checking across devices.");

    expect(result.toLowerCase()).not.toContain("every device");
    expect(result.toLowerCase()).not.toContain("keep checking across devices");
  });
});
