import type { BehaviorSupportInput, ContinuityState } from "../types";

export function deriveContinuityState(input: Pick<
  BehaviorSupportInput,
  "lifecycleStage" | "previousActiveGapDays" | "recentActiveDays" | "totalCheckIns" | "weeklyCheckIns"
>): ContinuityState {
  let level: ContinuityState["level"];

  if (input.totalCheckIns === 0) {
    level = "starting";
  } else if (input.lifecycleStage === "returning" || (input.previousActiveGapDays ?? 0) >= 6) {
    level = "re-entering";
  } else if (input.weeklyCheckIns >= 4 || input.recentActiveDays >= 5) {
    level = "steady";
  } else if (input.weeklyCheckIns >= 2) {
    level = "settling";
  } else {
    level = "light";
  }

  return {
    level,
    recentCheckInDays: input.weeklyCheckIns,
    continuitySignal: Math.max(input.weeklyCheckIns, Math.min(input.recentActiveDays, 7)),
    lifecycleStage: input.lifecycleStage,
  };
}
