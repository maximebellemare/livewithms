import { describe, expect, it } from "vitest";
import { deriveBehavioralDemand } from "../../../lib/behavior-support/adaptive-softening/deriveBehavioralDemand";
import { deriveSuggestedEffortLevel } from "../../../lib/behavior-support/adaptive-softening/deriveSuggestedEffortLevel";
import { deriveGentleNormalization } from "../../../lib/behavior-support/self-compassion/deriveGentleNormalization";

describe("behavior support softening", () => {
  it("reduces effort expectations during low-energy or disrupted periods", () => {
    const demand = deriveBehavioralDemand({
      adaptiveStatePrimary: "LOW_ENERGY",
      disruption: {
        disrupted: true,
        severity: "light",
        reason: "dropoff",
      },
    });

    expect(demand).toBe("minimal");
    expect(deriveSuggestedEffortLevel(demand)).toBe("brief");
  });

  it("normalizes interruption without guilt language", () => {
    const message = deriveGentleNormalization({
      demand: "minimal",
      disruption: {
        disrupted: true,
        severity: "moderate",
        reason: "absence",
      },
    });

    expect(message.toLowerCase()).not.toMatch(/should|must|failed|behind|stay consistent/);
  });
});
