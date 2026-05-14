export type ReminderPermissionStatus = "unknown" | "granted" | "denied" | "unavailable";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  permissionStatus: ReminderPermissionStatus;
  notificationId: string | null;
};

export type ReminderTimeOption = {
  id: string;
  label: string;
  hour: number;
  minute: number;
};

export type ReminderEnableResult =
  | { ok: true }
  | { ok: false; status: ReminderPermissionStatus };
