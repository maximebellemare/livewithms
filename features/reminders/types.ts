export type ReminderPermissionStatus = "unknown" | "granted" | "denied" | "unavailable";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  permissionStatus: ReminderPermissionStatus;
  notificationId: string | null;
  medicationRemindersEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  appointmentReminderOneDay: boolean;
  appointmentReminderOneHour: boolean;
  quietReminders: boolean;
};

export type ReminderTimeOption = {
  id: string;
  label: string;
  hour: number;
  minute: number;
};

export type ReminderContentTone = "daily-checkin" | "gentle-nudge" | "consistency-support";

export type ReminderEnableResult =
  | { ok: true }
  | { ok: false; status: ReminderPermissionStatus };
