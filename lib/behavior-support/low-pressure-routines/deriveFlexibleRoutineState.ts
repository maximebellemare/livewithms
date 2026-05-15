import type { AdaptiveStateSignal } from "../../longitudinal/types";
import type { FlexibleRoutineState, RecoveryExperience } from "../types";

export function deriveFlexibleRoutineState(input: {
  adaptiveStatePrimary: AdaptiveStateSignal;
  hasActiveRoutine: boolean;
  recoveryExperience: RecoveryExperience;
}): FlexibleRoutineState {
  if (input.hasActiveRoutine) {
    return {
      shouldOfferResume: true,
      shouldReducePressure: true,
      title: "Continue gently",
      body:
        input.recoveryExperience.style === "extra-gentle"
          ? "You can pick this up in a smaller way today, or leave it for later."
          : "You can return to this with one small next step whenever it feels useful.",
    };
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return {
      shouldOfferResume: false,
      shouldReducePressure: true,
      title: "Keep routines flexible",
      body: "These tools can stay interruptible. You can use only the part that helps right now.",
    };
  }

  return {
    shouldOfferResume: false,
    shouldReducePressure: false,
    title: "Use what fits today",
    body: "You can move through these tools in whatever order feels supportive.",
  };
}
