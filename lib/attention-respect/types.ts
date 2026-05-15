import type { ReminderContentTone } from "../../features/reminders/types";

export type AttentionLoad = "low" | "moderate" | "high";
export type NotificationNecessity = "silent" | "optional" | "helpful";
export type InterruptionSafety = "safe" | "soften" | "avoid";
export type SessionEntryState = "quiet-entry" | "steady-entry" | "reflective-entry";
export type CalmOrientation = {
  title: string;
  body: string;
};
export type SessionClosure = {
  title: string;
  body: string;
  encourageStop: boolean;
};
export type HealthyExitState = "easy-exit" | "soft-exit";
export type NotificationSoftness = ReminderContentTone;

