import type { NotificationSoftness } from "../types";

export function deriveNotificationSoftness(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  necessity: "silent" | "optional" | "helpful";
}) : NotificationSoftness {
  if (input.necessity === "silent") {
    return "gentle-nudge";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "WITHDRAWN") {
    return "gentle-nudge";
  }

  return "daily-checkin";
}

