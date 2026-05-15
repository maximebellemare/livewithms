import type { AdaptiveFlowInput, NotificationCadence } from "../types";

export function deriveNotificationCadence(input: AdaptiveFlowInput): NotificationCadence {
  if (input.adaptiveState.primary === "OVERWHELMED") {
    return "SUPPRESSED";
  }

  if (input.adaptiveState.primary === "LOW_ENERGY") {
    return "SPACED";
  }

  if (input.adaptiveState.primary === "WITHDRAWN" || input.lifecycleStage === "returning") {
    return "GENTLE_RECONNECT";
  }

  return "STANDARD";
}
