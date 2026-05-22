import { describe, expect, it } from "vitest";
import { deriveLaunchReadinessAudit } from "../../../lib/platform-stewardship/launch-readiness/deriveLaunchReadinessAudit";

describe("platform stewardship launch readiness audit", () => {
  it("marks the calm product identity as launch-ready when drift is absent", () => {
    const result = deriveLaunchReadinessAudit({
      lowEnergyModeEnabled: true,
      recentFatigueAverage: 4,
      recentStressAverage: 3.9,
      recentSleepAverage: 5.9,
      overwhelmDetected: true,
      interactionTolerance: "reduced",
      message: "Everything feels heavy and I need calmer support.",
    });

    expect(result.ready).toBe(true);
    expect(result.identity.coherent).toBe(true);
    expect(result.trust.boundedAdaptation).toBe(true);
    expect(result.operations.quietRecovery).toBe(true);
  });

  it("surfaces unsafe launch drift if the platform starts sounding companion-like or manipulative", () => {
    const result = deriveLaunchReadinessAudit({
      message: "Your AI companion will stay with you forever, and you should keep going.",
    });

    expect(result.ready).toBe(false);
    expect(result.reasons.join(" ").toLowerCase()).toMatch(/unsafe|pressure|boundary/);
  });
});
