import type { NotificationCadence } from "../../energy-aware/types";
import type { ReminderContentTone } from "../../../features/reminders/types";

export function preventReminderOverload(input: {
  pressure: "low" | "moderate" | "high";
  cadence: NotificationCadence;
  tone: ReminderContentTone;
  interruptionSafety: "safe" | "soften" | "avoid";
}) {
  if (input.pressure === "high" || input.interruptionSafety === "avoid") {
    return {
      shouldSchedule: false,
      cadence: "SUPPRESSED" as const,
      tone: "gentle-nudge" as const,
    };
  }

  if (input.pressure === "moderate") {
    return {
      shouldSchedule: true,
      cadence: input.cadence === "STANDARD" ? ("SPACED" as const) : input.cadence,
      tone: "gentle-nudge" as const,
    };
  }

  return {
    shouldSchedule: true,
    cadence: input.cadence,
    tone: input.tone,
  };
}
