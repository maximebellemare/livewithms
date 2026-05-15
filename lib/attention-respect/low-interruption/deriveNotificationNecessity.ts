import type { NotificationNecessity } from "../types";

export function deriveNotificationNecessity(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
  reminderEnabled: boolean;
}): NotificationNecessity {
  if (!input.reminderEnabled) {
    return "silent";
  }

  if (input.adaptiveStatePrimary === "OVERWHELMED" || input.attentionLoad === "high") {
    return "silent";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "optional";
  }

  return "helpful";
}

