import type { ReminderContentTone } from "../../../features/reminders/types";
import type { AdaptiveFlowInput } from "../types";

export function deriveNotificationTone(input: AdaptiveFlowInput): ReminderContentTone {
  if (
    input.adaptiveState.primary === "LOW_ENERGY" ||
    input.adaptiveState.primary === "OVERWHELMED" ||
    input.adaptiveState.primary === "WITHDRAWN" ||
    input.lifecycleStage === "returning"
  ) {
    return "gentle-nudge";
  }

  if (input.lifecycleStage === "first-week") {
    return "daily-checkin";
  }

  return "consistency-support";
}
