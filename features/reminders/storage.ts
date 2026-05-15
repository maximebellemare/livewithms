import { appSecureStore } from "../../lib/secure-store";
import type { ReminderSettings } from "./types";
import { APP_CONFIG } from "../../lib/app-config";

const REMINDER_SETTINGS_KEY = "livewithms.reminder-settings";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: APP_CONFIG.reminders.defaultHour,
  minute: APP_CONFIG.reminders.defaultMinute,
  permissionStatus: "unknown",
  notificationId: null,
};

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const raw = await appSecureStore.getItem(REMINDER_SETTINGS_KEY);

  if (!raw) {
    return DEFAULT_REMINDER_SETTINGS;
  }

  try {
    return {
      ...DEFAULT_REMINDER_SETTINGS,
      ...(JSON.parse(raw) as Partial<ReminderSettings>),
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings) {
  await appSecureStore.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}
