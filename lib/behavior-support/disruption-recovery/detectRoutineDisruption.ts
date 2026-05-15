import type { BehaviorSupportInput, RoutineDisruption } from "../types";

export function detectRoutineDisruption(
  input: Pick<BehaviorSupportInput, "lifecycleStage" | "previousActiveGapDays" | "weeklyCheckIns">,
): RoutineDisruption {
  if (input.lifecycleStage === "returning" || (input.previousActiveGapDays ?? 0) >= 6) {
    return {
      disrupted: true,
      severity: "moderate",
      reason: "absence",
    };
  }

  if (input.weeklyCheckIns <= 1) {
    return {
      disrupted: true,
      severity: "light",
      reason: "dropoff",
    };
  }

  return {
    disrupted: false,
    severity: "none",
    reason: "none",
  };
}
