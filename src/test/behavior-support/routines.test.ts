import { describe, expect, it } from "vitest";
import { deriveFlexibleRoutineState } from "../../../lib/behavior-support/low-pressure-routines/deriveFlexibleRoutineState";
import { deriveResumableProgramFlow } from "../../../lib/behavior-support/low-pressure-routines/deriveResumableProgramFlow";
import { generateSelfCompassionReinforcement } from "../../../lib/behavior-support/self-compassion/generateSelfCompassionReinforcement";

describe("behavior support routines", () => {
  it("keeps routines resumable instead of punitive", () => {
    const routineState = deriveFlexibleRoutineState({
      adaptiveStatePrimary: "OVERWHELMED",
      hasActiveRoutine: true,
      recoveryExperience: {
        style: "extra-gentle",
        reduceDemand: true,
        simplifyReturn: true,
      },
    });
    const flow = deriveResumableProgramFlow({
      toolTitle: "Low-energy day checklist",
      continuationLabel: null,
      routineState,
    });

    expect(routineState.shouldOfferResume).toBe(true);
    expect(`${flow.title} ${flow.body}`.toLowerCase()).not.toMatch(/behind|complete everything|finish/);
  });

  it("reinforces self-compassion without sounding celebratory or therapeutic", () => {
    const message = generateSelfCompassionReinforcement({
      continuity: {
        level: "re-entering",
        recentCheckInDays: 1,
        continuitySignal: 2,
        lifecycleStage: "returning",
      },
      recoveryExperience: {
        style: "open",
        reduceDemand: true,
        simplifyReturn: true,
      },
    });

    expect(message.toLowerCase()).not.toMatch(/congratulations|proud|healing journey|therapy/);
  });
});
