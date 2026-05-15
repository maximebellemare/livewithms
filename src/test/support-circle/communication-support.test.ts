import { describe, expect, it } from "vitest";
import { deriveEnergyCommunication } from "../../../lib/support-circle/communication-support/deriveEnergyCommunication";
import { derivePacingExplanation } from "../../../lib/support-circle/communication-support/derivePacingExplanation";

describe("support circle communication support", () => {
  it("helps explain lower energy without shame", () => {
    const result = deriveEnergyCommunication({
      fatigueAverage: 4.3,
      stressAverage: 3.2,
    });

    expect(result.toLowerCase()).toContain("energy");
    expect(result.toLowerCase()).not.toContain("failure");
  });

  it("frames pacing needs gently", () => {
    const result = derivePacingExplanation({
      fatigueAverage: 4.1,
      sleepAverage: 5.9,
    });

    expect(result.toLowerCase()).toContain("rest");
    expect(result.toLowerCase()).not.toContain("push");
  });
});
