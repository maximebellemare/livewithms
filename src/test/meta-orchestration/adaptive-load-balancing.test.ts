import { describe, expect, it } from "vitest";
import { deriveAdaptationIntensity } from "../../../lib/meta-orchestration/adaptive-load-balancing/deriveAdaptationIntensity";
import { preventAdaptationOverstacking } from "../../../lib/meta-orchestration/adaptive-load-balancing/preventAdaptationOverstacking";

describe("meta orchestration adaptive load balancing", () => {
  it("reduces adaptation intensity when too many systems are active", () => {
    expect(
      deriveAdaptationIntensity({
        adaptiveStatePrimary: "STABLE",
        burden: "moderate",
        activeSystemCount: 7,
        hasAiVisible: true,
      }),
    ).toBe("minimal");
  });

  it("prevents adaptation overstacking when AI and reflections are both visible", () => {
    expect(
      preventAdaptationOverstacking({
        requestedCount: 3,
        adaptationIntensity: "moderate",
        hasAiVisible: true,
        hasReflectionsVisible: true,
      }),
    ).toBe(1);
  });
});
