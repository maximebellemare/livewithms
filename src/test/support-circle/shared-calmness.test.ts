import { describe, expect, it } from "vitest";
import { deriveLowPressureSharing } from "../../../lib/support-circle/shared-calmness/deriveLowPressureSharing";
import { preventSurveillanceDynamics } from "../../../lib/support-circle/shared-calmness/preventSurveillanceDynamics";

describe("support circle shared calmness", () => {
  it("keeps sharing low pressure", () => {
    const result = deriveLowPressureSharing({
      role: "trusted-friend",
      hasRecentDifficulty: true,
    });

    expect(result.toLowerCase()).toContain("brief");
    expect(result.toLowerCase()).not.toContain("constant");
  });

  it("removes surveillance framing", () => {
    const result = preventSurveillanceDynamics("Monitoring in real-time with alerts and oversight.");

    expect(result.toLowerCase()).not.toContain("monitor");
    expect(result.toLowerCase()).not.toContain("alert");
    expect(result.toLowerCase()).not.toContain("oversight");
  });
});
