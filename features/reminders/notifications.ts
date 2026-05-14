import type { ReminderPermissionStatus } from "./types";

type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status?: string; granted?: boolean; ios?: { status?: number } }>;
  requestPermissionsAsync: () => Promise<{ status?: string; granted?: boolean; ios?: { status?: number } }>;
  scheduleNotificationAsync: (input: {
    content: {
      title: string;
      body: string;
      sound?: boolean;
    };
    trigger: {
      hour: number;
      minute: number;
      repeats: boolean;
    };
  }) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
};

function loadNotificationsModule(): NotificationsModule | null {
  try {
    const dynamicRequire = Function("return require")();
    return dynamicRequire("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
}

function normalizePermissionStatus(result: {
  status?: string;
  granted?: boolean;
  ios?: { status?: number };
}): ReminderPermissionStatus {
  if (result?.granted || result?.status === "granted" || result?.ios?.status === 2) {
    return "granted";
  }

  if (result?.status === "denied" || result?.ios?.status === 1) {
    return "denied";
  }

  return "unknown";
}

export function isNotificationsAvailable() {
  return loadNotificationsModule() !== null;
}

export async function getReminderPermissionStatus(): Promise<ReminderPermissionStatus> {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return "unavailable";
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    return normalizePermissionStatus(permissions);
  } catch {
    return "unknown";
  }
}

export async function requestReminderPermission(): Promise<ReminderPermissionStatus> {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return "unavailable";
  }

  try {
    const permissions = await Notifications.requestPermissionsAsync();
    return normalizePermissionStatus(permissions);
  } catch {
    return "unknown";
  }
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "How are you feeling today?",
      body: "A quick check-in can help you notice patterns.",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelScheduledReminder(identifier: string | null | undefined) {
  const Notifications = loadNotificationsModule();

  if (!Notifications || !identifier) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Keep cancellation failures silent so reminders never block the rest of the app.
  }
}
