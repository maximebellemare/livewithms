import { describe, expect, it } from "vitest";
import { deriveEcosystemLimits } from "../../../lib/ecosystem-intelligence/ecosystem-governance/deriveEcosystemLimits";
import { validateSupportLoadBalancing } from "../../../lib/ecosystem-intelligence/ecosystem-governance/validateSupportLoadBalancing";

describe("ecosystem intelligence ecosystem governance", () => {
  it("uses tighter ecosystem limits in overwhelmed states", () => {
    const result = deriveEcosystemLimits({
      adaptiveStatePrimary: "OVERWHELMED",
      burden: "high",
    });

    expect(result.maxVisibleSystems).toBe(2);
    expect(result.maxActions).toBe(1);
  });

  it("validates support load balancing", () => {
    expect(
      validateSupportLoadBalancing({
        visibleSystems: ["learning", "audio", "ambient"],
        actionCount: 2,
        lineCount: 2,
        maxVisibleSystems: 2,
        maxActions: 1,
        maxLines: 2,
      }).balanced,
    ).toBe(false);
  });
});
