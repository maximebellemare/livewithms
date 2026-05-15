import { describe, expect, it } from "vitest";
import { detectRoutineDisruption } from "../../../lib/behavior-support/disruption-recovery/detectRoutineDisruption";
import { deriveRecoveryExperience } from "../../../lib/behavior-support/disruption-recovery/deriveRecoveryExperience";
import { generateGentleReentry } from "../../../lib/behavior-support/disruption-recovery/generateGentleReentry";

describe("behavior support recovery", () => {
  it("keeps re-entry messaging emotionally safe after disruption", () => {
    const disruption = detectRoutineDisruption({
      lifecycleStage: "returning",
      previousActiveGapDays: 9,
      weeklyCheckIns: 0,
    });
    const recovery = deriveRecoveryExperience({
      adaptiveStatePrimary: "WITHDRAWN",
      disruption,
    });
    const message = generateGentleReentry(recovery);

    expect(disruption.severity).toBe("moderate");
    expect(recovery.reduceDemand).toBe(true);
    expect(`${message.title} ${message.body}`.toLowerCase()).not.toMatch(
      /welcome back|catch up|get back on track|you missed|failure/,
    );
  });

  it("stays steady when there is no major disruption", () => {
    const disruption = detectRoutineDisruption({
      lifecycleStage: "active",
      previousActiveGapDays: 1,
      weeklyCheckIns: 4,
    });
    const recovery = deriveRecoveryExperience({
      adaptiveStatePrimary: "STABLE",
      disruption,
    });

    expect(disruption.disrupted).toBe(false);
    expect(recovery.style).toBe("steady");
  });
});
